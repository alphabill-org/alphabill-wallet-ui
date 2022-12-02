import { Formik } from "formik";
import * as Yup from "yup";
import { Link, Navigate } from "react-router-dom";

import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import Button from "../../components/Button/Button";
import Textfield from "../../components/Textfield/Textfield";
import Logo from "../../images/ab-logo.svg";
import Spacer from "../../components/Spacer/Spacer";
import {
  extractFormikError,
  getKeys,
  unit8ToHexPrefixed,
} from "../../utils/utils";
import { useAuth } from "../../hooks/useAuth";
import { useApp } from "../../hooks/appProvider";

function Login(): JSX.Element | null {
  const { setUserKeys, login } = useAuth();
  const { setActiveAccountId, balances } = useApp();
  const vault = localStorage.getItem("ab_wallet_vault");
  const userKeys = localStorage.getItem("ab_wallet_pub_keys");

  if (
    Boolean(balances) &&
    Boolean(vault) &&
    Boolean(userKeys) &&
    vault !== "null" &&
    userKeys !== "null"
  ) {
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

          const { hashingPublicKey, decryptedVault } = getKeys(
            values.password,
            0,
            vault
          );

          if (
            unit8ToHexPrefixed(hashingPublicKey!) !==
            decryptedVault.pub_keys?.split(" ")[0]
          ) {
            return setErrors({ password: "Password is incorrect!" });
          }

          setUserKeys(decryptedVault.pub_keys);
          setActiveAccountId(unit8ToHexPrefixed(hashingPublicKey!));
          login();
        }}
        validationSchema={Yup.object().shape({
          password: Yup.string().test(
            "empty-or-8-characters-check",
            "password must be at least 8 characters",
            (password) => !password || password.length >= 8
          ),
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
          {"Recover wallet from your secret recovery phrase"}
        </Link>
        <Spacer mb={16} />
        <Link to="/create-wallet">
          {"Don't have an wallet? Create a wallet"}
        </Link>
      </div>
    </div>
  );
}

export default Login;
