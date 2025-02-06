import { FeeCreditRecord } from '@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord';
import { AddFeeCredit } from '@alphabill/alphabill-js-sdk/lib/fees/transactions/AddFeeCredit';
import { TransferFeeCredit } from '@alphabill/alphabill-js-sdk/lib/fees/transactions/TransferFeeCredit';
import { MoneyPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient';
import { TokenPartitionJsonRpcClient } from '@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient';
import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { NetworkIdentifier } from '@alphabill/alphabill-js-sdk/lib/NetworkIdentifier';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import type { ISigningService } from '@alphabill/alphabill-js-sdk/lib/signing/ISigningService';
import { ClientMetadata } from '@alphabill/alphabill-js-sdk/lib/transaction/ClientMetadata';
import { AlwaysTruePredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/predicates/AlwaysTruePredicate';
import { PayToPublicKeyHashPredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/predicates/PayToPublicKeyHashPredicate';
import { PayToPublicKeyHashProofFactory } from '@alphabill/alphabill-js-sdk/lib/transaction/proofs/PayToPublicKeyHashProofFactory';
import { FormEvent, ReactElement, useCallback, useMemo, useState } from 'react';

import { Result, ValidatedData } from '../../ValidatedData';
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
import { useAlphas } from '../../hooks/alpha';
import { useAlphabill } from '../../hooks/alphabill';
import { useFeeCredits } from '../../hooks/feecredit';
import { useVault } from '../../hooks/vault';
import CheckIcon from '../../images/check-ico.svg?react';
import { formatValueWithDecimalPlaces } from '../../utils/decimal';

interface IFormData {
  readonly bill: Result<Bill>;
  readonly signingService: Result<ISigningService>;
  readonly amount: Result<bigint>;
}

// TODO: Fix page design and code. Reset selected state when network is changed. Show network selection even when error occurs with queries
export function Fees(): ReactElement {
  const alphabill = useAlphabill();
  const vault = useVault();
  const [errors, setErrors] = useState(new Map<keyof IFormData, string>());
  const [selectedAlpha, setSelectedAlpha] = useState<Bill | undefined>(undefined);
  const [selectedFeeCredit, setSelectedFeeCredit] = useState<FeeCreditRecord | undefined>(undefined);
  const [selectedPartition, setSelectedPartition] = useState<PartitionIdentifier.MONEY | PartitionIdentifier.TOKEN>(
    PartitionIdentifier.MONEY,
  );
  const { alphas, resetAlphas } = useAlphas();
  const { moneyFeeCredits, tokenFeeCredits, resetFeeCredits } = useFeeCredits();

  const moneyFeeCreditTotal = useMemo(() => {
    return moneyFeeCredits.data?.reduce((total, feeCredit) => total + feeCredit.balance, 0n) ?? 0n;
  }, [moneyFeeCredits.data]);

  const tokenFeeCreditTotal = useMemo(() => {
    return tokenFeeCredits.data?.reduce((total, feeCredit) => total + feeCredit.balance, 0n) ?? 0n;
  }, [tokenFeeCredits.data]);

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

      if (selectedAlpha && selectedAlpha.value < amount) {
        return { data: null, error: 'Alpha does not have enough balance.' };
      }

      return { data: amount, error: null };
    },
    [selectedAlpha],
  );

  const tryGetSigningService = useCallback(
    async (password: string, index: number): Promise<Result<ISigningService>> => {
      try {
        return { data: await vault.getSigningService(password, index), error: null };
      } catch (e) {
        return {
          data: null,
          error: `Could not create signing service: ${e instanceof Error ? e.message : String(e)}.`,
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
      feeCreditRecord?: FeeCreditRecord,
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
        networkIdentifier: NetworkIdentifier.LOCAL,
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
          networkIdentifier: NetworkIdentifier.LOCAL,
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
      const formData = new FormData(ev.currentTarget);

      const validatedData = new ValidatedData<IFormData>({
        amount: parseAmount(String(formData.get('amount'))),
        bill: selectedAlpha ? { data: selectedAlpha, error: null } : { data: null, error: 'Alpha is not selected.' },
        signingService: await tryGetSigningService(String(formData.get('password')), 0),
      }).getData();

      if (validatedData.errors) {
        return setErrors(validatedData.errors);
      }

      setErrors(new Map());
      try {
        if (!alphabill) {
          throw new Error('Invalid alphabill context');
        }

        await addFeeCredit(
          validatedData.data.amount,
          validatedData.data.bill,
          validatedData.data.signingService,
          selectedPartition,
          alphabill.moneyClient,
          selectedPartition === PartitionIdentifier.MONEY ? alphabill.moneyClient : alphabill.tokenClient,
          selectedFeeCredit,
        );
        await resetAlphas();
        await resetFeeCredits();
      } catch (e) {
        console.error('error', e);
      }
    },
    [
      alphabill,
      selectedAlpha,
      selectedPartition,
      selectedFeeCredit,
      parseAmount,
      tryGetSigningService,
      resetFeeCredits,
      setErrors,
    ],
  );

  if (alphas.isPending || moneyFeeCredits.isPending || tokenFeeCredits.isPending) {
    return (
      <div className="fees--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (alphas.isError || moneyFeeCredits.isError || tokenFeeCredits.isError) {
    const error = alphas.error || moneyFeeCredits.error || tokenFeeCredits.error;
    return (
      <div className="fees--error">
        <ErrorNotification title="Error occurred" info={error?.message} />
      </div>
    );
  }

  const feeCredits = selectedPartition === PartitionIdentifier.MONEY ? moneyFeeCredits.data : tokenFeeCredits.data;

  return (
    <form className="fees" onSubmit={onSubmit}>
      <Header />
      <Form>
        <FormContent>
          <div>
            Public key
            <PublicKeySelectBox />
          </div>
          <SelectBox
            label="Alphas"
            title="SELECT ALPHA"
            data={alphas.data}
            selectedItem={selectedAlpha?.unitId.toString()}
            select={(unit: Bill) => setSelectedAlpha(unit)}
            getOptionKey={(unit: Bill) => unit.unitId.toString()}
            createOption={(unit: Bill) => (
              <>
                <div className="select__option--text">{unit.unitId.toString()}</div>
                {selectedAlpha?.unitId.toString() === unit.unitId.toString() ? <CheckIcon /> : null}
              </>
            )}
          />
          {errors.get('bill') && <span className="textfield__error">{errors.get('bill')}</span>}
          <div>
            Transfer destination
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '6px' }}>
              <div
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectedPartition(PartitionIdentifier.MONEY);
                  setSelectedFeeCredit(undefined);
                }}
                style={{
                  background: selectedPartition === PartitionIdentifier.MONEY ? '#08e8de' : '#4e3eb6',
                  borderRadius: '4px',
                  color: selectedPartition === PartitionIdentifier.MONEY ? '#000' : '#FFF',
                  cursor: 'pointer',
                  flexBasis: '50%',
                  padding: '20px 10px',
                  textAlign: 'center',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  msUserSelect: 'none',
                  MozUserSelect: 'none',
                }}
              >
                Money partition
                <div style={{ fontSize: '12px' }}>
                  {formatValueWithDecimalPlaces(moneyFeeCreditTotal, ALPHA_DECIMAL_PLACES)}
                </div>
              </div>
              <div
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectedPartition(PartitionIdentifier.TOKEN);
                  setSelectedFeeCredit(undefined);
                }}
                style={{
                  background: selectedPartition === PartitionIdentifier.TOKEN ? '#08e8de' : '#4e3eb6',
                  borderRadius: '4px',
                  color: selectedPartition === PartitionIdentifier.TOKEN ? '#000' : '#FFF',
                  cursor: 'pointer',
                  flexBasis: '50%',
                  padding: '20px 10px',
                  textAlign: 'center',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  msUserSelect: 'none',
                  MozUserSelect: 'none',
                }}
              >
                Token partition
                <div style={{ fontSize: '12px' }}>
                  {formatValueWithDecimalPlaces(tokenFeeCreditTotal, ALPHA_DECIMAL_PLACES)}
                </div>
              </div>
            </div>
          </div>
          <SelectBox
            label="Fee credit (optional)"
            title="SELECT FEE CREDIT"
            data={feeCredits}
            selectedItem={selectedFeeCredit?.unitId.toString()}
            select={(unit: FeeCreditRecord) => setSelectedFeeCredit(unit)}
            getOptionKey={(unit: FeeCreditRecord) => unit.unitId.toString()}
            createOption={(unit: FeeCreditRecord) => (
              <>
                <div className="select__option--text">{unit.unitId.toString()}</div>
                {selectedFeeCredit?.unitId.toString() === unit.unitId.toString() ? <CheckIcon /> : null}
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
