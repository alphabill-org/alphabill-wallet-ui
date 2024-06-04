import { ReactElement, useContext, useEffect, useMemo, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Formik } from "formik";
import { HDKey } from "@scure/bip32";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";

import { Form, FormContent, FormFooter } from "../../components/Form/Form";
import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import TextAreaField from "../../components/TextAreaField/TextAreaField";
import { checkPassword, extractFormikError } from "../../utils/utils";
import Textfield from "../../components/Textfield/Textfield";
import Back from "../../images/back-ico.svg?react";
import { PublicKey } from "../../App";
import { VaultContext } from "../Login/Login";

function CreateAccount(): ReactElement | null {
  const [redirect, setRedirect] = useState(false);
  const { keys, addKey } = useContext(VaultContext);
  const navigate = useNavigate();
  const mnemonic = useMemo(() => generateMnemonic(), []);

  useEffect(() => {
    if (redirect) {
      navigate('/');
      setRedirect(false);
    }
  }, [keys]);

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
          Your Secret Recovery Phrase is a 12-word phrase that is the “master
          key” to your wallet and your funds.
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
              (password) => checkPassword(password)
            ),
            passwordConfirm: Yup.string().test(
              "empty-or-8-characters-check",
              "password must be at least 8 characters",
              (password) => checkPassword(password)
            ),
          })}
          onSubmit={(values, { setErrors }) => {
            if (values.password !== values.passwordConfirm) {
              return setErrors({ passwordConfirm: "Passwords don't match" });
            }

            const seed = mnemonicToSeedSync(mnemonic);
            const masterKey = HDKey.fromMasterSeed(seed);
            const hashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);
            if (!hashingKey.publicKey) {
              return setErrors({
                passwordConfirm: "Public key creation failed",
              });
            }

            // TODO: Remove previous state when creating new wallet

            addKey(new PublicKey(hashingKey.publicKey));
            setRedirect(true);
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
        <Spacer mb={24} />
        <div className="t-medium-small">
          <CopyToClipboard text={mnemonic}>
            <Button
              id="copy-tooltip"
              tooltipContent="Phrase copied"
              variant="link"
            >
              Copy the phrase
            </Button>
          </CopyToClipboard>{" "}
          & store it safely or memorize it. Never disclose your Secret Recovery
          Phrase. Anyone with this phrase can take your Alphabill forever.
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;
