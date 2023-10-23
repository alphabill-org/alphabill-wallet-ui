import { Formik } from "formik";
import * as Yup from "yup";
import { Link, Navigate } from "react-router-dom";

import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import Button from "../../components/Button/Button";
import Textfield from "../../components/Textfield/Textfield";
import Logo from "../../images/ab-logo-ico.svg";
import Spacer from "../../components/Spacer/Spacer";
import {
  extractFormikError,
  getKeys,
  unit8ToHexPrefixed,
} from "../../utils/utils";
import { useAuth } from "../../hooks/useAuth";
import { useApp } from "../../hooks/appProvider";
import { LocalKeyPubKeys, LocalKeyVault } from "../../utils/constants";

function Login(): JSX.Element | null {
  const { login } = useAuth();
  const { balances } = useApp();
  const vault = localStorage.getItem(LocalKeyVault);
  const userKeys = localStorage.getItem(LocalKeyPubKeys);

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
      <Spacer mb={36} />
      <div className="login__header">
        <img height="46" src={Logo} alt="Alphabill" />
        <Spacer mb={72} />
        <div>Log in to your wallet</div>
      </div>
      <Spacer mb={24} />
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

          login(unit8ToHexPrefixed(hashingPublicKey!), decryptedVault.pub_keys);
        }}
        validationSchema={Yup.object().shape({
          password: Yup.string().required("Password is required"),
        })}
      >
        {(formikProps) => {
          const { handleSubmit, errors, touched } = formikProps;

          return (
            <Form onSubmit={handleSubmit}>
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
                <Button big={true} block={true} type="submit" variant="primary">
                  Unlock
                </Button>
              </FormFooter>
            </Form>
          );
        }}
      </Formik>

      <div className="login__footer">
        <Link to="/recover-wallet">{"Forgot password?"}</Link>
        <Spacer mb={16} />
        <div>
          Don't have a wallet? <Link to="/create-wallet">{" Create"}</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
