import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter';
import { HDKey } from '@scure/bip32';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { ReactElement, useCallback, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alias } from './Alias';
import { Mnemonic } from './Mnemonic';
import { Password } from './Password';
import { useVault } from '../../hooks/vault';

interface ICreateWalletState {
  readonly step: CreateWalletStep;
  readonly password?: string;
  readonly keyInfo?: {
    readonly mnemonic: string;
    readonly key: HDKey;
  };
}

enum CreateWalletAction {
  SET_PASSWORD,
  SET_MNEMONIC,
  SET_STEP,
  RESET,
}

export enum CreateWalletStep {
  PASSWORD,
  MNEMONIC,
  ALIAS,
}

function reducer(
  previousState: ICreateWalletState,
  action:
    | { type: CreateWalletAction.SET_PASSWORD; password: string }
    | { type: CreateWalletAction.SET_MNEMONIC; key: HDKey; mnemonic: string }
    | { type: CreateWalletAction.SET_STEP; step: CreateWalletStep }
    | { type: CreateWalletAction.RESET },
): ICreateWalletState {
  switch (action.type) {
    case CreateWalletAction.SET_PASSWORD:
      return {
        ...previousState,
        password: action.password,
      };
    case CreateWalletAction.SET_MNEMONIC:
      return {
        ...previousState,
        keyInfo: {
          key: action.key,
          mnemonic: action.mnemonic,
        },
      };
    case CreateWalletAction.SET_STEP:
      return {
        ...previousState,
        step: action.step,
      };
    case CreateWalletAction.RESET:
      return {
        step: CreateWalletStep.PASSWORD,
      };
    default:
      throw new Error(`Unknown create wallet action ${String(action)}`);
  }
}

const steps = [CreateWalletStep.PASSWORD, CreateWalletStep.MNEMONIC, CreateWalletStep.ALIAS];

export function CreateWallet({ isWalletRecovery = false }: { isWalletRecovery?: boolean }): ReactElement {
  const navigate = useNavigate();
  const vault = useVault();
  const [{ step, keyInfo, password }, dispatch] = useReducer(reducer, { step: CreateWalletStep.PASSWORD });

  const setStep = useCallback(
    (step: CreateWalletStep): void => {
      dispatch({ type: CreateWalletAction.SET_STEP, step });
    },
    [dispatch],
  );

  const reset = useCallback((): void => {
    dispatch({ type: CreateWalletAction.RESET });
  }, [dispatch]);

  const nextStep = useCallback((): void => {
    const index = steps.indexOf(step);
    if (index < steps.length - 1) {
      setStep(steps[index + 1]);
    }
  }, [step]);

  const previousStep = useCallback((): void => {
    const index = steps.indexOf(step);
    if (index > 0) {
      setStep(steps[index - 1]);
    }
  }, [step]);

  const onStep1Submitted = useCallback(
    (password: string): void => {
      dispatch({ type: CreateWalletAction.SET_PASSWORD, password });
      nextStep();
    },
    [dispatch, nextStep],
  );

  const onStep2Submitted = useCallback(
    async (mnemonic: string): Promise<void> => {
      const key = await vault.deriveKey(mnemonic, 0);
      dispatch({ type: CreateWalletAction.SET_MNEMONIC, mnemonic, key });
      nextStep();
    },
    [dispatch, nextStep, vault],
  );

  const onStep3Submitted = useCallback(
    async (alias: string) => {
      if (!keyInfo || !password) {
        throw new Error('Data is missing for creating a wallet.');
      }

      await vault.createVault(keyInfo.mnemonic, password, { alias, index: 0 });
      reset();
      navigate('/', { replace: true });
    },
    [dispatch, keyInfo, password],
  );

  const mnemonic = useMemo(() => generateMnemonic(wordlist), []);
  const publicKey = useMemo(() => Base16Converter.encode(keyInfo?.key.publicKey ?? new Uint8Array()), [keyInfo]);

  switch (step) {
    case CreateWalletStep.PASSWORD:
      return <Password password={password} onSubmitSuccess={onStep1Submitted} previous={() => navigate('/')} />;
    case CreateWalletStep.MNEMONIC:
      return (
        <Mnemonic
          mnemonic={keyInfo?.mnemonic ?? (isWalletRecovery ? undefined : mnemonic)}
          onSubmitSuccess={onStep2Submitted}
          previous={previousStep}
        />
      );
    case CreateWalletStep.ALIAS: {
      return <Alias publicKey={publicKey} onSubmitSuccess={onStep3Submitted} previous={previousStep} />;
    }
  }
}
