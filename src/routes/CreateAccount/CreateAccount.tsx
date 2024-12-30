import { HDKey } from "@scure/bip32";
import { generateMnemonic, mnemonicToSeedSync, mnemonicToEntropy } from "bip39";
import CryptoJS from "crypto-js";
import { Formik } from "formik";
import { useMemo } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Link } from "react-router-dom";
import * as Yup from "yup";

import Button from "../../components/Button/Button";
import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import Spacer from "../../components/Spacer/Spacer";
import TextAreaField from "../../components/TextAreaField/TextAreaField";
import Textfield from "../../components/Textfield/Textfield";
import { useAuth } from "../../hooks/useAuth";
import Back from "../../images/back-ico.svg?react";
import { checkPassword, clearStorage, extractFormikError, unit8ToHexPrefixed } from "../../utils/utils";

function CreateAccount(): JSX.Element | null {
  const { login } = useAuth();
  const mnemonic = useMemo(() => generateMnemonic(), []);

  return (
    <div className="create-account">
      <div className="actions__header">
        <Link to="/" className="back-btn">
          <Back />
        </Link>
        <div className="actions__title">Create Account</div>
      </div>
      <div className="pad-24 t-medium-small">
        <div>
          Your Secret Recovery Phrase is a 12-word phrase that is the “master key” to your wallet and your funds.
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
              (password) => checkPassword(password),
            ),
            passwordConfirm: Yup.string().test(
              "empty-or-8-characters-check",
              "password must be at least 8 characters",
              (password) => checkPassword(password),
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
            const prefixedHashingPubKey = unit8ToHexPrefixed(hashingPubKey!);

            const encrypted = CryptoJS.AES.encrypt(prefixedHashingPubKey, values.password).toString();

            const decrypted = CryptoJS.AES.decrypt(encrypted, values.password);

            if (prefixedHashingPubKey === decrypted.toString(CryptoJS.enc.Latin1)) {
              const vaultData = {
                entropy: mnemonicToEntropy(mnemonic),
                pub_keys: prefixedHashingPubKey,
              };

              clearStorage();
              login(
                prefixedHashingPubKey,
                prefixedHashingPubKey,
                CryptoJS.AES.encrypt(JSON.stringify(vaultData), values.password).toString(),
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
                      focusInput
                    />
                    <Textfield
                      id="passwordCreateAccountConfirm"
                      name="passwordConfirm"
                      label="Confirm password"
                      type="password"
                      error={extractFormikError(errors, touched, ["passwordConfirm"])}
                    />
                  </FormContent>
                  <FormFooter>
                    <Button big={true} block={true} type="submit" variant="primary">
                      Next
                    </Button>
                  </FormFooter>
                </Form>
              </form>
            );
          }}
        </Formik>
        <Spacer mb={24} />
        <div className="t-medium-small">
          <CopyToClipboard text={mnemonic}>
            <Button id="copy-tooltip" tooltipContent="Phrase copied" variant="link">
              Copy the phrase
            </Button>
          </CopyToClipboard>{" "}
          & store it safely or memorize it. Never disclose your Secret Recovery Phrase. Anyone with this phrase can take
          your Alphabill forever.
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;
