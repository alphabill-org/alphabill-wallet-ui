import { Formik } from "formik";
import * as Yup from "yup";
import { Link, Navigate } from "react-router-dom";

import { Form, FormContent, FormFooter } from "../../components/Form/Form";
import Button from "../../components/Button/Button";
import Textfield from "../../components/Textfield/Textfield";
import Logo from "../../images/ab-logo.svg";
import Spacer from "../../components/Spacer/Spacer";
import { extractFormikError, getKeys, unit8ToHexPrefixed } from "../../utils/utils";
import { useAuth } from "../../hooks/useAuth";
import { createContext, PropsWithChildren, ReactElement, useCallback, useContext, useEffect, useState } from "react";
import { RuntimeEnvironmentContext } from "../../index";
import { PublicKey } from "../../App";

export const storageVaultKey = 'alphabill_vault';

interface IVault {
  readonly keys: PublicKey[];
  addKey(key: PublicKey): void;
}

export const VaultContext = createContext<IVault>({ keys: [], addKey: () => {} });

export function VaultContextProvider({ children, state }: PropsWithChildren<{state?: { keys: PublicKey[]}}>) {
  const [keys, setKeys] = useState<PublicKey[]>(state?.keys || []);
  const runtimeEnvironment = useContext(RuntimeEnvironmentContext);

  useEffect(() => {
    runtimeEnvironment?.storage.local.set(
      {
        [storageVaultKey]: {
          keys: keys.map((key) => key.toString())
        }
      });
  }, [keys]);

  const addKey = useCallback((key: PublicKey) => {
    setKeys((keys) => [...keys, key]);
  }, [setKeys, keys]);

  return (
    <VaultContext.Provider value={{ keys, addKey }}>
      {children}
    </VaultContext.Provider>
  );
}


function Login(): ReactElement | null {
  const { keys } = useContext(VaultContext);
  const { login } = useAuth();
  // const { balances } = useApp();
  //const vault = localStorage.getItem(LocalKeyVault);
  // const userKeys = localStorage.getItem(LocalKeyPubKeys);

  if (keys.length > 0) {
    return <Navigate to="/" />;
  }

  return (
    <div className="login pad-24">
      <Spacer mb={56} />
      <div className="login__header">
        <img height="32" src={Logo} alt="Alphabill" />
        <Spacer mb={32} />
        <div>Welcome back to Alphabill Wallet!</div>
      </div>
      <Spacer mb={60} />
      <Formik
        initialValues={{
          password: ""
        }}
        onSubmit={(values, { setErrors }) => {
          console.log(keys);
          if (!vault) {
            return setErrors({
              password: "No active wallet with this password"
            });
          }

          const { error, hashingPublicKey, decryptedVault } = getKeys(
            values.password,
            0,
            keys
          );

          if (
            error ||
            unit8ToHexPrefixed(hashingPublicKey) !==
            decryptedVault.pub_keys?.split(" ")[0]
          ) {
            return setErrors({ password: "Password is incorrect!" });
          }

          login(unit8ToHexPrefixed(hashingPublicKey), decryptedVault.pub_keys);
        }}
        validationSchema={Yup.object().shape({
          password: Yup.string().required("Password is required")
        })}
      >
        {(formikProps) => {
          const { handleSubmit, errors, touched } = formikProps;

          return (
            <form onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  <Textfield
                    id="passwordLogin"
                    name="password"
                    label="password"
                    type="password"
                    error={extractFormikError(errors, touched, ["password"])}
                    focusInput
                  />
                </FormContent>
                <FormFooter>
                  <Button
                    big={true}
                    block={true}
                    type="submit"
                    variant="primary"
                  >
                    Unlock
                  </Button>
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>

      <div className="login__footer">
        <Link to="/recover-wallet">
          {"Recover wallet from recovery phrase"}
        </Link>
        <Spacer mb={16} />
        <Link to="/create-wallet">
          {"Don't have a wallet? Create a wallet"}
        </Link>
      </div>
    </div>
  );
}

export default Login;
