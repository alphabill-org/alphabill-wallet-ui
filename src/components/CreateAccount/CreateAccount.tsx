import { Formik } from "formik";
import { HDKey } from "@scure/bip32";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import * as Yup from "yup";
import shaJS from "sha.js";
import CryptoJS from "crypto-js";

import { Form, FormFooter, FormContent } from "../Form/Form";
import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import TextAreaField from "../TextAreaField/TextAreaField";
import { extractFormikError } from "../../utils/utils";
import Textfield from "../Textfield/Textfield";

export interface ICreateAccountProps {
  setIsLoggedIn: (e: any) => void;
  setIsCreateAccountView: (e: any) => void;
}

function CreateAccount(props: ICreateAccountProps): JSX.Element | null {
  const mnemonic = generateMnemonic();

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
        <div className="actions__title">Create Account</div>
      </div>
      <Spacer mb={16} />
      <div className="pad-24-h">
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
          }}
          validationSchema={Yup.object().shape({
            password: Yup.string().test(
              "empty-or-8-characters-check",
              "password must be at least 8 characters",
              (password) => !password || password.length >= 8
            ),
          })}
          onSubmit={(values) => {
            const seed = mnemonicToSeedSync(mnemonic);
            const masterKey = HDKey.fromMasterSeed(seed);
            const hashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);
            const hashingPrivKey = hashingKey.privateKey;
            const hashingPubKey = hashingKey.publicKey;
            const data = {
              keys: {
                account1: {
                  privKey:
                    "0x" +
                    CryptoJS.AES.encrypt(
                      Buffer.from(hashingPrivKey!).toString("hex"),
                      values.password
                    ),
                  pubKey: "0x" + Buffer.from(hashingPubKey!).toString("hex"),
                  keyHash: {
                    sha256: CryptoJS.AES.encrypt(
                      shaJS("sha256").update(hashingPubKey!).digest("hex"),
                      values.password
                    ),
                    sha512: CryptoJS.AES.encrypt(
                      shaJS("sha512").update(hashingPubKey!).digest("hex"),
                      values.password
                    ),
                  },
                },
              },
            };

            const encrypted = CryptoJS.AES.encrypt(
              data.keys.account1.pubKey,
              values.password
            ).toString();

            const decrypted = CryptoJS.AES.decrypt(encrypted, values.password);

            chrome?.storage?.local?.set({ enenKeys: data });
            localStorage.setItem("pubKeys", data.keys.account1.pubKey);
            localStorage.setItem("encryptedKeys", encrypted);
            console.log(data.keys.account1.pubKey);

            if (
              data.keys.account1.pubKey ===
              decrypted.toString(CryptoJS.enc.Utf8)
            ) {
              props.setIsLoggedIn(true);
            }

            props.setIsCreateAccountView(false);
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
                      id="password"
                      name="password"
                      label="Create password"
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
