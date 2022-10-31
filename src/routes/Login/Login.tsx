import { Formik } from "formik";
import * as Yup from "yup";
import CryptoJS from "crypto-js";
import { Link } from "react-router-dom";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";

import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import Button from "../../components/Button/Button";
import Textfield from "../../components/Textfield/Textfield";
import Logo from "../../images/ab-logo.svg";
import Spacer from "../../components/Spacer/Spacer";
import { extractFormikError } from "../../utils/utils";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";

function Login(): JSX.Element | null {
  const { login } = useAuth();

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
        onSubmit={(values) => {
          const entropy = localStorage.getItem("ab_wallet_entropy") || "";
          const entropyDecrypted = CryptoJS.AES.decrypt(
            entropy,
            values.password
          );

          const seed = mnemonicToSeedSync(
            entropyToMnemonic(entropyDecrypted?.toString(CryptoJS.enc.Utf8))
          );
          const masterKey = HDKey.fromMasterSeed(seed);
          const hashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);
          const hashingPubKey = hashingKey.publicKey;
          const prefixedHashingPubKey =
            "0x" + Buffer.from(hashingPubKey!).toString("hex");

          axios
            .get<void>(
              "https://dev-ab-wallet-backend.abdev1.guardtime.com/admin/balance?pubkey=" +
                prefixedHashingPubKey +
                ""
            )
            .then(() => login(prefixedHashingPubKey));

          if (Buffer.from(hashingPubKey!).toString("hex")) {
            login(prefixedHashingPubKey);
          }
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
                    id="password"
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
        <Link to="/register">{"Forgot password? Recover wallet"}</Link>
        <Spacer mb={16} />
        <Link to="/create-wallet">
          {"Don't have an wallet? Create a wallet"}
        </Link>
      </div>
    </div>
  );
}

export default Login;
