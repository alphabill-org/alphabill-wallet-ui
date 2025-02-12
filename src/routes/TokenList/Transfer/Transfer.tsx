import { NetworkIdentifier } from '@alphabill/alphabill-js-sdk/lib/NetworkIdentifier';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { TransferFungibleToken } from '@alphabill/alphabill-js-sdk/lib/tokens/transactions/TransferFungibleToken';
import { AlwaysTruePredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/predicates/AlwaysTruePredicate';
import { PayToPublicKeyHashPredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/predicates/PayToPublicKeyHashPredicate';
import { AlwaysTrueProofFactory } from '@alphabill/alphabill-js-sdk/lib/transaction/proofs/AlwaysTrueProofFactory';
import { PayToPublicKeyHashProofFactory } from '@alphabill/alphabill-js-sdk/lib/transaction/proofs/PayToPublicKeyHashProofFactory';
import { UnitId } from '@alphabill/alphabill-js-sdk/lib/UnitId';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { useQueryClient } from '@tanstack/react-query';
import { FormEvent, ReactElement, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../../components/Button/Button';
import { ErrorNotification } from '../../../components/ErrorNotification/ErrorNotification';
import { Form, FormContent, FormFooter } from '../../../components/Form/Form';
import { PasswordField } from '../../../components/InputField/PasswordField';
import { TextField } from '../../../components/InputField/TextField';
import { Loading } from '../../../components/Loading/Loading';
import { useAlphabill } from '../../../hooks/alphabillContext';
import { useFungibleTokens } from '../../../hooks/fungibleToken';
import { useUnitsList } from '../../../hooks/unitsList';
import { useVault } from '../../../hooks/vaultContext';
import BackIcon from '../../../images/back-ico.svg?react';

type FormElements = 'address' | 'password';

export function Transfer(): ReactElement {
  const alphabill = useAlphabill();
  const params = useParams<{ id: string }>();
  const vault = useVault();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const fungibleTokens = useFungibleTokens(vault.selectedKey?.publicKey.key ?? null);
  const feeCredits = useUnitsList(vault.selectedKey?.publicKey.key ?? null, PartitionIdentifier.TOKEN);

  const unitIdParam = params.id;
  if (!unitIdParam) {
    throw new Error('');
  }
  const unitId = UnitId.fromBytes(Base16Converter.decode(unitIdParam));

  if (fungibleTokens.isPending || feeCredits.isPending) {
    return <Loading title="Loading..." />;
  }

  if (fungibleTokens.isError || feeCredits.isError) {
    const error = fungibleTokens.error || feeCredits.error;

    return (
      <div className="units--error">
        <ErrorNotification
          title="Error occurred"
          info={
            <>
              {error?.message} <br />
              <Link to="/units/fungible">Go back</Link>
            </>
          }
        />
      </div>
    );
  }

  const transfer = useCallback(async (ev: FormEvent<HTMLFormElement>): Promise<void> => {
    ev.preventDefault();
    const errors = new Map<FormElements, string>();
    const data = new FormData(ev.currentTarget);
    const address = String(data.get('address') ?? '');
    if (address.length === 0) {
      errors.set('address', 'Invalid address.');
    }

    const password = String(data.get('password') ?? '');
    let signingService;
    try {
      signingService = await vault.getSigningService(password, vault.selectedKey!.index);
    } catch (e) {
      errors.set('password', e instanceof Error ? e.message : String(e));
      return;
    }
    const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

    const round = (await alphabill!.tokenClient.getRoundInfo()).roundNumber;
    const alwaysTrueProofFactory = new AlwaysTrueProofFactory();
    const token = fungibleTokens.data?.get(unitId.toString());
    if (!token) {
      console.log('Token not found');
      return;
    }

    const feeCreditRecordId = feeCredits.data?.feeCreditRecords.at(0);
    if (!feeCreditRecordId) {
      console.log('Fee credit not found');
      return;
    }
    const newOwnerPredicate = PayToPublicKeyHashPredicate.create(Base16Converter.decode(address));
    const txo = TransferFungibleToken.create({
      metadata: {
        feeCreditRecordId,
        maxTransactionFee: 10n,
        referenceNumber: null,
        timeout: round + 60n,
      },
      networkIdentifier: NetworkIdentifier.LOCAL,
      ownerPredicate: newOwnerPredicate,
      stateLock: null,
      stateUnlock: new AlwaysTruePredicate(),
      token: token!,
      version: 1n,
    }).sign(proofFactory, proofFactory, [alwaysTrueProofFactory]);
    const transferHash = await alphabill!.tokenClient.sendTransaction(await txo);
    const transferProof = await alphabill!.tokenClient.waitTransactionProof(transferHash, TransferFungibleToken);
    if (!transferProof.transactionRecord.serverMetadata.successIndicator) {
      console.log('Transfer failed');
      return;
    }
    await queryClient.resetQueries({
      predicate: (query) => {
        return query.queryKey.at(0) === 'UNITS';
      },
    });
    navigate('/units/fungible');
  }, []);

  return (
    <div className="transfer">
      <div className="transfer__header">
        <Link to="/" className="back-btn">
          <BackIcon />
        </Link>
        <div className="transfer__title">Transfer</div>
      </div>
      <div className="transfer pad-24">
        <form onSubmit={transfer}>
          <Form>
            <FormContent>
              <TextField label="Address" name="address" focusInput />
              <PasswordField label="password" name="password" />
            </FormContent>
            <FormFooter>
              <Button block={true} type="submit" variant="primary">
                Transfer
              </Button>
            </FormFooter>
          </Form>
        </form>
      </div>
    </div>
  );
}
