import { Formik } from "formik";
import { HDKey } from "@scure/bip32";
import { generateMnemonic, mnemonicToSeedSync, mnemonicToEntropy } from "bip39";
import * as Yup from "yup";
import CryptoJS from "crypto-js";
import { Link } from "react-router-dom";
import axios from "axios";

import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import TextAreaField from "../../components/TextAreaField/TextAreaField";
import { extractFormikError, pubKeyToHex } from "../../utils/utils";
import Textfield from "../../components/Textfield/Textfield";
import { ReactComponent as Back } from "../../images/back-ico.svg";
import { useAuth } from "../../hooks/useAuth";
import { useApp } from "../../hooks/appProvider";

function CreateAccount(): JSX.Element | null {
  const { login, setUserKeys, setVault } = useAuth();
  const mnemonic = generateMnemonic();
  const { setActiveAccountId } = useApp();

  const downloadTxtFile = () => {
    const element = document.createElement("a");
    const file = new Blob([mnemonic], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = "recovery_phrase.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="create-account">
      <div className="actions__header">
        <Link to="/" className="back-btn">
          <Back />
        </Link>
        <div className="actions__title">Create Account</div>
      </div>
      <div className="pad-24">
        <div>
          Your Secret Recovery Phrase is a 12-word phrase that is the “master
          key” to your wallet and your funds. It makes it easy to back up and
          restore your account.
          <Spacer mb={8} />
        </div>
        <Spacer mb={16} />
        <Formik
          initialValues={{
            mnemonic: "",
            password: "",
            passwordConfirm: "",
          }}
          validationSchema={Yup.object().shape({
            password: Yup.string().test(
              "empty-or-8-characters-check",
              "password must be at least 8 characters",
              (password) => !password || password.length >= 8
            ),
            passwordConfirm: Yup.string().test(
              "empty-or-8-characters-check",
              "password must be at least 8 characters",
              (password) => !password || password.length >= 8
            ),
          })}
          onSubmit={(values, { setErrors }) => {
            if (values.password !== values.passwordConfirm) {
              return setErrors({ passwordConfirm: "Passwords don't match" });
            }

            const seed = mnemonicToSeedSync(mnemonic);
            const masterKey = HDKey.fromMasterSeed(seed);
            const hashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);
            const hashingPubKey = hashingKey.publicKey;
            const prefixedHashingPubKey = pubKeyToHex(hashingPubKey!);

            const encrypted = CryptoJS.AES.encrypt(
              prefixedHashingPubKey,
              values.password
            ).toString();

            const decrypted = CryptoJS.AES.decrypt(encrypted, values.password);

            if (
              prefixedHashingPubKey === decrypted.toString(CryptoJS.enc.Latin1)
            ) {
              axios
                .post<void>(
                  "https://dev-ab-wallet-backend.abdev1.guardtime.com/admin/add-key",
                  {
                    pubkey: decrypted.toString(CryptoJS.enc.Latin1),
                  }
                )
                .then(() => {
                  const vaultData = {
                    entropy: mnemonicToEntropy(mnemonic),
                    pub_keys: prefixedHashingPubKey,
                  };

                  setVault(
                    CryptoJS.AES.encrypt(
                      JSON.stringify(vaultData),
                      values.password
                    ).toString()
                  );
                  localStorage.setItem(
                    "ab_wallet_account_names",
                    JSON.stringify({
                      ["_" + 0]: "Account 1",
                    })
                  );
                  setActiveAccountId(prefixedHashingPubKey);
                  setUserKeys(prefixedHashingPubKey);
                  login(prefixedHashingPubKey);
                })
                .catch(() =>
                  setErrors({ passwordConfirm: "Key was not added" })
                );
            } else {
              return setErrors({
                passwordConfirm: "Public key creation failed",
              });
            }
          }}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;

            return (
              <form onSubmit={handleSubmit}>
                <Form>
                  <FormContent>
                    <TextAreaField
                      id="mnemonic"
                      name="mnemonic"
                      type="mnemonic"
                      label="Secret Recovery Phrase"
                      error={extractFormikError(errors, touched, ["mnemonic"])}
                      className="center"
                      value={mnemonic}
                      disabled
                    />
                    <Textfield
                      id="passwordCreateAccount"
                      name="password"
                      label="New password (8 characters min)"
                      type="password"
                      error={extractFormikError(errors, touched, ["password"])}
                    />
                    <Textfield
                      id="passwordCreateAccountConfirm"
                      name="passwordConfirm"
                      label="Confirm password"
                      type="password"
                      error={extractFormikError(errors, touched, [
                        "passwordConfirm",
                      ])}
                    />
                  </FormContent>
                  <FormFooter>
                    <Button
                      big={true}
                      block={true}
                      type="submit"
                      variant="primary"
                    >
                      Next
                    </Button>
                  </FormFooter>
                </Form>
              </form>
            );
          }}
        </Formik>
        <Spacer mb={32} />
        <div className="t-medium-small">
          Memorize this phrase & never disclose your Secret Recovery Phrase.
          Anyone with this phrase can take your Ether forever.
        </div>
        <Spacer mb={16} />
        <Button
          big={true}
          block={true}
          type="button"
          variant="secondary"
          onClick={() => downloadTxtFile()}
        >
          Download Secret Recovery Phrase
        </Button>
      </div>
    </div>
  );
}

export default CreateAccount;
