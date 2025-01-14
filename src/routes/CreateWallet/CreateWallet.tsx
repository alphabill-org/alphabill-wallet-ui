import { HDKey } from "@scure/bip32";
import { mnemonicToSeed } from "@scure/bip39";
import { ReactElement, useCallback, useReducer } from "react";
import { Outlet } from "react-router-dom";
import { useVault } from "../../hooks/vault";

interface ICreateWalletState {
  password?: string;
  key?: { mnemonic: string; initialKey: HDKey };
}

enum CreateWalletAction {
  SET_PASSWORD,
  SET_MNEMONIC,
}

function reducer(
  previousState: ICreateWalletState,
  action:
    | { type: CreateWalletAction.SET_PASSWORD; password: string }
    | { type: CreateWalletAction.SET_MNEMONIC; key: HDKey; mnemonic: string },
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
        key: {
          initialKey: action.key,
          mnemonic: action.mnemonic,
        },
      };
    default:
      throw new Error(`Unknown create wallet action ${String(action)}`);
  }
}

export interface ICreateWalletContext extends ICreateWalletState {
  setPassword: (password: string) => void;
  setMnemonic: (mnemonic: string) => Promise<void>;
}

export function CreateWallet(): ReactElement {
  const vault = useVault();
  const [state, dispatch] = useReducer(reducer, {});

  const setPassword = useCallback(
    (password: string) => {
      dispatch({ type: CreateWalletAction.SET_PASSWORD, password });
    },
    [dispatch],
  );

  const setMnemonic = useCallback(
    async (mnemonic: string): Promise<void> => {
      const key = await vault.deriveKey(mnemonic, 0);
      dispatch({ type: CreateWalletAction.SET_MNEMONIC, mnemonic, key });
    },
    [dispatch],
  );

  return (
    <>
      <Outlet context={{ ...state, setPassword, setMnemonic }} />
    </>
  );
}

// {/*<Formik*/}
//         {/*  initialValues={{*/}
//         {/*    mnemonic: "",*/}
//         {/*    password: "",*/}
//         {/*    passwordConfirm: "",*/}
//         {/*  }}*/}
//         {/*  validationSchema={Yup.object().shape({*/}
//         {/*    password: Yup.string().test(*/}
//         {/*      "empty-or-8-characters-check",*/}
//         {/*      "password must be at least 8 characters",*/}
//         {/*      (password) => checkPassword(password),*/}
//         {/*    ),*/}
//         {/*    passwordConfirm: Yup.string().test(*/}
//         {/*      "empty-or-8-characters-check",*/}
//         {/*      "password must be at least 8 characters",*/}
//         {/*      (password) => checkPassword(password),*/}
//         {/*    ),*/}
//         {/*  })}*/}
//         {/*  onSubmit={(values, { setErrors }) => {*/}
//         {/*    if (values.password !== values.passwordConfirm) {*/}
//         {/*      return setErrors({ passwordConfirm: "Passwords don't match" });*/}
//         {/*    }*/}
//
//         {/*    const seed = mnemonicToSeedSync(mnemonic);*/}
//         {/*    const masterKey = HDKey.fromMasterSeed(seed);*/}
//         {/*    const hashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);*/}
//         {/*    const hashingPubKey = hashingKey.publicKey;*/}
//         {/*    const prefixedHashingPubKey = unit8ToHexPrefixed(hashingPubKey!);*/}
//
//         {/*    const encrypted = CryptoJS.AES.encrypt(prefixedHashingPubKey, values.password).toString();*/}
//
//         {/*    const decrypted = CryptoJS.AES.decrypt(encrypted, values.password);*/}
//
//         {/*    if (prefixedHashingPubKey === decrypted.toString(CryptoJS.enc.Latin1)) {*/}
//         {/*      const vaultData = {*/}
//         {/*        entropy: mnemonicToEntropy(mnemonic),*/}
//         {/*        pub_keys: prefixedHashingPubKey,*/}
//         {/*      };*/}
//
//         {/*      clearStorage();*/}
//         {/*      login(*/}
//         {/*        prefixedHashingPubKey,*/}
//         {/*        prefixedHashingPubKey,*/}
//         {/*        CryptoJS.AES.encrypt(JSON.stringify(vaultData), values.password).toString(),*/}
//         {/*      );*/}
//         {/*    } else {*/}
//         {/*      return setErrors({*/}
//         {/*        passwordConfirm: "Public key creation failed",*/}
//         {/*      });*/}
//         {/*    }*/}
//         {/*  }}*/}
//         {/*>*/}
//         {/*  {(formikProps) => {*/}
//         {/*    const { handleSubmit, errors, touched } = formikProps;*/}
//
//         {/*    return (*/}
//
//         {/*<TextAreaField*/}
//         {/*  id="mnemonic"*/}
//         {/*  name="mnemonic"*/}
//         {/*  type="mnemonic"*/}
//         {/*  label="Secret Recovery Phrase"*/}
//         {/*  error={null}*/}
//         {/*  className="center"*/}
//         {/*  value={mnemonic}*/}
//         {/*  disabled*/}
//         {/*/>*/}
//
//         {/*    );*/}
//         {/*  }}*/}
//         {/*</Formik>*/}
