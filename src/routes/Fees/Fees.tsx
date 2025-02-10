import { FeeCreditRecord } from '@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord';
import { AddFeeCredit } from '@alphabill/alphabill-js-sdk/lib/fees/transactions/AddFeeCredit';
import { TransferFeeCredit } from '@alphabill/alphabill-js-sdk/lib/fees/transactions/TransferFeeCredit';
import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { MoneyPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient';
import { TokenPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient';
import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import type { ISigningService } from '@alphabill/alphabill-js-sdk/lib/signing/ISigningService';
import { ClientMetadata } from '@alphabill/alphabill-js-sdk/lib/transaction/ClientMetadata';
import { AlwaysTruePredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/predicates/AlwaysTruePredicate';
import { PayToPublicKeyHashPredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/predicates/PayToPublicKeyHashPredicate';
import { PayToPublicKeyHashProofFactory } from '@alphabill/alphabill-js-sdk/lib/transaction/proofs/PayToPublicKeyHashProofFactory';
import { FormEvent, ReactElement, useCallback, useState } from 'react';

import { Button } from '../../components/Button/Button';
import { ErrorNotification } from '../../components/ErrorNotification/ErrorNotification';
import { FormContent } from '../../components/Form/components/FormContent';
import { FormFooter } from '../../components/Form/components/FormFooter';
import { Form } from '../../components/Form/Form';
import { Header } from '../../components/Header/Header';
import { PasswordField } from '../../components/InputField/PasswordField';
import { TextField } from '../../components/InputField/TextField';
import { Loading } from '../../components/Loading/Loading';
import { PublicKeySelectBox } from '../../components/PublicKeySelectBox/PublicKeySelectBox';
import { SelectBox } from '../../components/SelectBox/SelectBox';
import { ALPHA_DECIMAL_PLACES } from '../../constants';
import { useAlphabill } from '../../hooks/alphabillContext';
import { useUnitsList } from '../../hooks/unitsList';
import { useVault } from '../../hooks/vaultContext';
import CheckIcon from '../../images/check-ico.svg?react';
import { Result, ValidatedData } from '../../ValidatedData';

interface IFormData {
  readonly bill: Result<Bill>;
  readonly signingService: Result<ISigningService>;
  readonly amount: Result<bigint>;
}

interface IFeesContentProps {
  partition: PartitionIdentifier.MONEY | PartitionIdentifier.TOKEN;
}

function FeesContent({ partition }: IFeesContentProps): ReactElement {
  const alphabill = useAlphabill();
  const vault = useVault();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState(new Map<string, string>());
  const [selectedAlpha, setSelectedAlpha] = useState<string | undefined>(undefined);
  const [selectedFeeCreditId, setselectedFeeCreditId] = useState<string | undefined>(undefined);

  const moneyPartitionUnits = useUnitsList(vault.selectedKey?.publicKey.key ?? null, PartitionIdentifier.MONEY);
  const tokenPartitionUnits = useUnitsList(vault.selectedKey?.publicKey.key ?? null, PartitionIdentifier.TOKEN);

  const parseAmount = useCallback(
    (input: string): Result<bigint> => {
      if (!RegExp(`^\\d+(\\.\\d{1,${ALPHA_DECIMAL_PLACES}})?$`).test(input)) {
        return {
          data: null,
          error: `Invalid amount, fraction count must be maximum of ${ALPHA_DECIMAL_PLACES} numbers.`,
        };
      }

      const amount =
        BigInt(input.split('.')?.at(0) ?? 0) * BigInt(10 ** ALPHA_DECIMAL_PLACES) +
        BigInt(input.split('.').at(1)?.padEnd(ALPHA_DECIMAL_PLACES, '0') ?? 0);

      if (amount <= 0) {
        return { data: null, error: 'Fee must be greater than 0.' };
      }

      // if (selectedAlpha && (getAlpha(selectedAlpha)?.value ?? 0) < amount) {
      //   return { data: null, error: 'Alpha does not have enough balance.' };
      // }

      return { data: amount, error: null };
    },
    [selectedAlpha, moneyPartitionUnits.data?.bills],
  );

  const tryGetSigningService = useCallback(
    async (password: string, index?: number): Promise<Result<ISigningService>> => {
      if (index == null) {
        return {
          data: null,
          error: 'Invalid key index',
        };
      }

      try {
        return { data: await vault.getSigningService(password, index), error: null };
      } catch (e) {
        console.warn(`Could not create signing service: ${e instanceof Error ? e.message : String(e)}.`);
        return {
          data: null,
          error: 'Invalid password',
        };
      }
    },
    [selectedAlpha],
  );

  const addFeeCredit = useCallback(
    async (
      amount: bigint,
      bill: Bill,
      signingService: ISigningService,
      targetPartitionIdentifier: PartitionIdentifier,
      moneyClient: MoneyPartitionJsonRpcClient,
      targetClient: MoneyPartitionJsonRpcClient | TokenPartitionJsonRpcClient,
      feeCreditRecord: FeeCreditRecord | null,
    ) => {
      if (!alphabill) {
        throw new Error(`Invalid alphabill context: ${alphabill}`);
      }

      const round = (await moneyClient.getRoundInfo()).roundNumber;
      const ownerPredicate = PayToPublicKeyHashPredicate.create(signingService.publicKey);
      const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

      const transferFeeCreditTransactionOrder = await TransferFeeCredit.create({
        amount,
        bill,
        feeCreditRecord: {
          counter: feeCreditRecord?.counter,
          ownerPredicate: ownerPredicate,
          unitId: feeCreditRecord?.unitId,
        },
        latestAdditionTime: round + 60n,
        metadata: new ClientMetadata(round + 60n, 5n, null, new Uint8Array()),
        // TODO: NetworkIdentifier from networks
        networkIdentifier: alphabill.network.networkId,
        stateLock: null,
        stateUnlock: new AlwaysTruePredicate(),
        targetPartitionIdentifier,
        version: 1n,
      }).sign(proofFactory);

      try {
        const transferFeeCreditHash = await moneyClient.sendTransaction(transferFeeCreditTransactionOrder);
        const transferFeeCreditProof = await moneyClient.waitTransactionProof(transferFeeCreditHash, TransferFeeCredit);

        const addFeeCreditTransactionOrder = await AddFeeCredit.create({
          feeCreditRecord: { unitId: transferFeeCreditTransactionOrder.payload.attributes.targetUnitId },
          metadata: new ClientMetadata(round + 60n, 5n, null, new Uint8Array()),
          networkIdentifier: alphabill.network.networkId,
          ownerPredicate: ownerPredicate,
          proof: transferFeeCreditProof,
          stateLock: null,
          stateUnlock: new AlwaysTruePredicate(),
          targetPartitionIdentifier,
          version: 1n,
        }).sign(proofFactory);

        const addFeeCreditHash = await targetClient.sendTransaction(addFeeCreditTransactionOrder);
        await targetClient.waitTransactionProof(addFeeCreditHash, AddFeeCredit);
      } catch (e) {
        console.error('error', e);
      }
    },
    [alphabill],
  );

  const onSubmit = useCallback(
    async (ev: FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      setIsProcessing(true);
      const formData = new FormData(ev.currentTarget);

      // const alpha = selectedAlpha ? getAlpha(selectedAlpha) : null;
      // const feeCreditRecord = selectedFeeCreditId ? (feeCredits.data?.get(selectedFeeCreditId) ?? null) : null;
      const alpha = null;
      const feeCreditRecord = null;

      const validatedData = new ValidatedData<IFormData>({
        amount: parseAmount(String(formData.get('amount'))),
        bill: alpha ? { data: alpha, error: null } : { data: null, error: 'Alpha is not found.' },
        signingService: await tryGetSigningService(String(formData.get('password')), vault.selectedKey?.index),
      }).getData();

      if (validatedData.errors) {
        setIsProcessing(false);
        return setErrors(validatedData.errors);
      }

      try {
        if (!alphabill) {
          throw new Error('Invalid alphabill context');
        }

        await addFeeCredit(
          validatedData.data.amount,
          validatedData.data.bill,
          validatedData.data.signingService,
          partition,
          alphabill.moneyClient,
          partition === PartitionIdentifier.MONEY ? alphabill.moneyClient : alphabill.tokenClient,
          feeCreditRecord,
        );
        // await resetAlphas();
        // await resetFeeCredits();
      } catch (e) {
        console.error('error', e);
      } finally {
        setIsProcessing(false);
        setErrors(new Map());
      }
    },
    [
      alphabill,
      vault.selectedKey,
      selectedAlpha,
      partition,
      selectedFeeCreditId,
      parseAmount,
      tryGetSigningService,

      setErrors,
    ],
  );

  if (!alphabill) {
    return (
      <div className="fees--error">
        <ErrorNotification
          title="NO NETWORK SELECTED"
          info="Select network from the header. If no network exists, add it from settings."
        />
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="fees--loading">
        <Loading title="Processing transaction..." />
      </div>
    );
  }

  if (moneyPartitionUnits.isPending || tokenPartitionUnits.isPending) {
    return (
      <div className="fees--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (moneyPartitionUnits.isError || tokenPartitionUnits.isError) {
    const error = moneyPartitionUnits.error || tokenPartitionUnits.error;
    return (
      <div className="fees--error">
        <ErrorNotification title="Error occurred" info={error?.message} />
      </div>
    );
  }

  const feeCredits =
    partition === PartitionIdentifier.MONEY
      ? moneyPartitionUnits.data.feeCreditRecords
      : tokenPartitionUnits.data.feeCreditRecords;

  return (
    <form onSubmit={onSubmit}>
      <Form>
        <FormContent>
          <SelectBox
            label="Alphas"
            title="SELECT ALPHA"
            data={moneyPartitionUnits.data.bills}
            selectedItem={selectedAlpha}
            select={(unitId: IUnitId) => setSelectedAlpha(unitId.toString())}
            getOptionKey={(unitId: IUnitId) => unitId.toString()}
            createOption={(unitId: IUnitId) => (
              <>
                <div className="select__option--text">{unitId.toString()}</div>
                {selectedAlpha === unitId.toString() ? <CheckIcon /> : null}
              </>
            )}
          />
          {errors.get('bill') && <span className="textfield__error">{errors.get('bill')}</span>}
          <SelectBox
            label="Fee credit (optional)"
            title="SELECT FEE CREDIT"
            data={feeCredits}
            selectedItem={selectedFeeCreditId}
            select={(unit: IUnitId) => setselectedFeeCreditId(unit.toString())}
            getOptionKey={(unit: IUnitId) => unit.toString()}
            createOption={(unit: IUnitId) => (
              <>
                <div className="select__option--text">{unit.toString()}</div>
                {selectedFeeCreditId === unit.toString() ? <CheckIcon /> : null}
              </>
            )}
          />
          <TextField name="amount" label="Amount to transfer" error={errors.get('amount')} />
          <PasswordField name="password" label="Password" error={errors.get('signingService')} />
        </FormContent>
        <FormFooter>
          <Button block={true} type="submit" variant="primary">
            Add
          </Button>
        </FormFooter>
      </Form>
    </form>
  );
}

// TODO: Fix page design and code. Reset selected state when network is changed. Show network selection even when error occurs with queries
export function Fees(): ReactElement {
  const [partition, setPartition] = useState<PartitionIdentifier.MONEY | PartitionIdentifier.TOKEN>(
    PartitionIdentifier.MONEY,
  );

  return (
    <div className="fees">
      <Header />
      <div className="fees__content">
        <PublicKeySelectBox />
        Public key
        <FeesContent partition={partition} />
        <div style={{ borderBottom: '1px solid #4E3EB6', display: 'flex', marginBottom: '24px', marginTop: '12px' }}>
          <div
            onClick={() => setPartition(PartitionIdentifier.MONEY)}
            style={{
              // TODO: Fix style and move to css
              borderBottom: partition === PartitionIdentifier.MONEY ? '1px solid #08E8DE' : '',
              cursor: 'pointer',
              flexGrow: 1,
              textAlign: 'center',
            }}
          >
            Money partition
          </div>
          <div
            onClick={() => setPartition(PartitionIdentifier.TOKEN)}
            style={{
              borderBottom: partition === PartitionIdentifier.TOKEN ? '1px solid #08E8DE' : '',
              cursor: 'pointer',
              flexGrow: 1,
              textAlign: 'center',
            }}
          >
            Token partition
          </div>
        </div>
      </div>
    </div>
  );
}
