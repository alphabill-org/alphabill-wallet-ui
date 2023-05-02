import { Formik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";

import { Form, FormFooter, FormContent } from "../components/Form/Form";
import Button from "../components/Button/Button";
import Textfield from "../components/Textfield/Textfield";
import Logo from "../images/ab-logo.svg";
import Spacer from "../components/Spacer/Spacer";
import {
  extractFormikError,
  getKeys,
  unit8ToHexPrefixed,
} from "../utils/utils";
import { useAuth } from "../hooks/useAuth";
import { useMemo } from "react";
import Select from "../components/Select/Select";

function Connect(): JSX.Element | null {
  const { setIsConnectWalletRedirect, userKeys } = useAuth();
  const keysArr = useMemo(() => userKeys?.split(" ") || [], [userKeys]);
  const vault = localStorage.getItem("ab_wallet_vault");

  return (
    <div className="login pad-24">
      <Spacer mb={56} />
      <div className="login__header">
        <img height="32" src={Logo} alt="Alphabill" />
        <Spacer mb={32} />
        <div>Connect Alphabill Wallet with Alphabill store!</div>
      </div>
      <Spacer mb={60} />
      <Formik
        initialValues={{
          password: "",
          keys: "",
        }}
        onSubmit={(values, { setErrors }) => {
          if (!vault || vault === "null") {
            return setErrors({
              password: "No active wallet with this password",
            });
          }

          const { error, hashingPublicKey, decryptedVault } = getKeys(
            values.password,
            0,
            vault
          );

          if (
            error ||
            unit8ToHexPrefixed(hashingPublicKey!) !==
              decryptedVault.pub_keys?.split(" ")[0]
          ) {
            return setErrors({ password: "Password is incorrect!" });
          }

          // Send a message from the content script to the background script
          chrome?.runtime
            ?.sendMessage({
              externalMessage: {
                connectionConfirmed: true,
                pubKey: values?.keys || unit8ToHexPrefixed(hashingPublicKey!),
              },
            })
            .then(() => {
              setIsConnectWalletRedirect(false);
              chrome?.storage?.local
                .set({ is_connect_redirect: false })
                .then(() => window.close());
            });
        }}
        validationSchema={Yup.object().shape({
          password: Yup.string().required("Password is required"),
        })}
      >
        {(formikProps) => {
          const { handleSubmit, errors, touched } = formikProps;

          return (
            <form onSubmit={handleSubmit}>
              <Form>
                <FormContent>
                  {keysArr.length >= 1 && (
                    <Select
                      label="Keys"
                      name="keys"
                      options={keysArr?.map((key: string) => ({
                        value: key,
                        label: key,
                      }))}
                      error={extractFormikError(errors, touched, ["keys"])}
                    />
                  )}
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
                    Connect
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

export default Connect;
