import { Formik } from "formik";
import { Link, Navigate } from "react-router-dom";
import * as Yup from "yup";

import Button from "../../components/Button/Button";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import Spacer from "../../components/Spacer/Spacer";
import InputField from "../../components/InputField/InputField";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import Logo from "../../images/ab-logo.svg?react";
import { LocalKeyPubKeys, LocalKeyVault } from "../../utils/constants";
import { extractFormikError, getKeys, unit8ToHexPrefixed } from "../../utils/utils";

function Login(): JSX.Element | null {
  const { login } = useAuth();
  const { balances } = useApp();
  const vault = localStorage.getItem(LocalKeyVault);
  const userKeys = localStorage.getItem(LocalKeyPubKeys);

  if (Boolean(balances) && Boolean(vault) && Boolean(userKeys) && vault !== "null" && userKeys !== "null") {
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
          password: "",
        }}
        onSubmit={(values, { setErrors }) => {
          if (!vault || vault === "null") {
            return setErrors({
              password: "No active wallet with this password",
            });
          }

          const { error, hashingPublicKey, decryptedVault } = getKeys(values.password, 0, vault);

          if (error || unit8ToHexPrefixed(hashingPublicKey!) !== decryptedVault.pub_keys?.split(" ")[0]) {
            return setErrors({ password: "Password is incorrect!" });
          }

          login(unit8ToHexPrefixed(hashingPublicKey!), decryptedVault.pub_keys);
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
                  <InputField
                    id="passwordLogin"
                    name="password"
                    label="password"
                    type="password"
                    error={extractFormikError(errors, touched, ["password"])}
                    focusInput
                  />
                </FormContent>
                <FormFooter>
                  <Button big={true} block={true} type="submit" variant="primary">
                    Unlock
                  </Button>
                </FormFooter>
              </Form>
            </form>
          );
        }}
      </Formik>

      <div className="login__footer">
        <Link to="/recover-wallet">{"Recover wallet from recovery phrase"}</Link>
        <Spacer mb={16} />
        <Link to="/create-wallet">{"Don't have a wallet? Create a wallet"}</Link>
      </div>
    </div>
  );
}

export default Login;
