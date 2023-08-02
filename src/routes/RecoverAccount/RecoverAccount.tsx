import { Formik } from "formik";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeed, mnemonicToEntropy } from "bip39";
import * as Yup from "yup";
import CryptoJS from "crypto-js";
import { Link } from "react-router-dom";

import { Form, FormFooter, FormContent } from "../../components/Form/Form";
import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import {
  checkPassword,
  clearStorage,
  extractFormikError,
  unit8ToHexPrefixed,
} from "../../utils/utils";
import Textfield from "../../components/Textfield/Textfield";
import { ReactComponent as Back } from "../../images/back-ico.svg";
import { useAuth } from "../../hooks/useAuth";

function RecoverAccount(): JSX.Element | null {
  const { login } = useAuth();
  return (
    <div className="create-account">
      <div className="actions__header">
        <Link to="/" className="back-btn">
          <Back />
        </Link>
        <div className="actions__title">Recover a wallet</div>
      </div>
      <div className="pad-24 t-medium-small">
        <div>
          If you have already created a Alphabill wallet then you can import it
          with an existing 12 word Secret Recovery Phrase
          <Spacer mb={8} />
        </div>
        <Spacer mb={16} />
        <Formik
          initialValues={{
            mnemonicRecovery: "",
            password: "",
            passwordConfirm: "",
          }}
          validationSchema={Yup.object().shape({
            password: Yup.string().test(
              "empty-or-8-characters-check",
              "password must be at least 8 characters",
              (password) => checkPassword(password)
            ),
            passwordConfirm: Yup.string().test(
              "empty-or-8-characters-check",
              "password must be at least 8 characters",
              (password) => checkPassword(password)
            ),
          })}
          onSubmit={(values: any, { setErrors }) => {
            if (values.password !== values.passwordConfirm) {
              return setErrors({ passwordConfirm: "Passwords don't match" });
            }

            const mnemonicArr = values.mnemonicRecovery.split(" ");

            mnemonicArr.forEach((word: string) => {
              const index = mnemonicArr.indexOf(word);

              if (index === -1) {
                setErrors({
                  passwordConfirm: "Invalid secret recovery phrase",
                });
              }
            });

            if (Number(mnemonicArr?.length) % 3 !== 0) {
              return setErrors({
                passwordConfirm: "Invalid secret recovery phrase",
              });
            }

            mnemonicToSeed(values.mnemonicRecovery)
              .then((seed) => {
                const masterKey = HDKey.fromMasterSeed(seed);
                const hashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);
                const hashingPubKey = hashingKey.publicKey;
                const encrypted = CryptoJS.AES.encrypt(
                  unit8ToHexPrefixed(hashingPubKey!),
                  values.password
                ).toString();
                const prefixedPubKey = unit8ToHexPrefixed(hashingPubKey!);
                const decrypted = CryptoJS.AES.decrypt(
                  encrypted,
                  values.password
                );

                if (
                  prefixedPubKey === decrypted.toString(CryptoJS.enc.Latin1)
                ) {
                  const vaultData = {
                    entropy: mnemonicToEntropy(values.mnemonicRecovery),
                    pub_keys: prefixedPubKey,
                  };

                  clearStorage();
                  login(
                    prefixedPubKey,
                    prefixedPubKey,
                    CryptoJS.AES.encrypt(
                      JSON.stringify(vaultData),
                      values.password
                    ).toString()
                  );
                }
              })
              .catch((e) => setErrors({ passwordConfirm: e.message }));
          }}
        >
          {(formikProps) => {
            const { handleSubmit, errors, touched } = formikProps;
            return (
              <form onSubmit={handleSubmit}>
                <Form>
                  <FormContent>
                    <Spacer mb={8} />
                    <Textfield
                      id="mnemonicRecovery"
                      name="mnemonicRecovery"
                      label="Secret Recovery Phrase"
                      error={extractFormikError(errors, touched, [
                        "mnemonicRecovery",
                      ])}
                      type="password"
                      focusInput
                    />
                    <Spacer mb={8} />
                    <Textfield
                      id="passwordRecoverAccount"
                      name="password"
                      label="New password (8 characters min)"
                      type="password"
                      error={extractFormikError(errors, touched, ["password"])}
                    />
                    <Textfield
                      id="passwordRecoverAccountConfirm"
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
      </div>
    </div>
  );
}

export default RecoverAccount;
