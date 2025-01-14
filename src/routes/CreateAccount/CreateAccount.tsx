import { generateMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { ReactElement, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/Button/Button";
import { Form, FormContent, FormFooter } from "../../components/Form/Form";
import PasswordField from "../../components/InputField/PasswordField";
import { TextField } from "../../components/InputField/TextField";
import { TextAreaField } from "../../components/TextAreaField/TextAreaField";
import CloseIcon from "../../images/close.svg?react";
import CopyIcon from "../../images/copy-ico.svg?react";

interface IAccountState {
  password?: string;
  passwordConfirmation?: string;
  mnemonic?: string;
}

interface ILocation<State> {
  state: State;
}

function CreateAccountHeader({ title }: { title: string }): ReactElement {
  return (
    <div className="create-account__header">
      <div className="create-account__title">{title}</div>
      <Link to="/" className="close-btn">
        <CloseIcon />
      </Link>
    </div>
  );
}

function CreateAccountFooter({
  previousLabel,
  nextLabel,
  onPrevious,
}: {
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
}): ReactElement {
  return (
    <div className="create-account__footer">
      <Button type="button" variant="secondary" className="create-account__footer__cancel" onClick={onPrevious}>
        {previousLabel}
      </Button>
      <Button type="submit" variant="primary" className="create-account__footer__next">
        {nextLabel}
      </Button>
    </div>
  );
}

type PasswordFormElements = "password" | "passwordConfirmation";

export function CreateAccountPasswordPage(): ReactElement {
  const location: ILocation<IAccountState | undefined> = useLocation();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Map<PasswordFormElements, string>>(new Map());

  return (
    <form
      className="create-account"
      onSubmit={(ev) => {
        ev.preventDefault();
        const errors = new Map<PasswordFormElements, string>();
        const data = new FormData(ev.currentTarget);
        const password = String(data.get("password"));
        const passwordConfirmation = String(data.get("passwordConfirmation"));

        if (password.length < 8) {
          errors.set("password", "Password must be at least 8 characters long.");
        }

        if (password !== passwordConfirmation) {
          errors.set("passwordConfirmation", "Passwords did not match.");
        }

        if (errors.size === 0) {
          navigate("/create-wallet/step-2", { state: { ...location.state, password, passwordConfirmation } });
        }

        setErrors(errors);
      }}
    >
      <CreateAccountHeader title="Create Password" />
      <div className="create-account__progress">
        <div className="create-account__progress--active" style={{ width: "33%" }}></div>
      </div>

      <div className="pad-24 t-medium-small">
        <Form>
          <FormContent>
            <PasswordField
              name="password"
              label="Password"
              value={location.state?.password ?? ""}
              error={errors.get("password")}
              focusInput
            />
            <PasswordField
              name="passwordConfirmation"
              label="Confirm password"
              value={location.state?.passwordConfirmation ?? ""}
              error={errors.get("passwordConfirmation")}
            />
          </FormContent>
        </Form>
      </div>
      <CreateAccountFooter previousLabel="Cancel" nextLabel="Next" onPrevious={() => navigate("/")} />
    </form>
  );
}

type MnemonicFormElements = "mnemonic";
export function CreateAccountMnemonicPage(): ReactElement {
  const navigate = useNavigate();
  const location: ILocation<IAccountState | undefined> = useLocation();
  const [errors, setErrors] = useState<Map<MnemonicFormElements, string>>(new Map());
  const mnemonic = useMemo(() => location.state?.mnemonic ?? generateMnemonic(wordlist), []);

  return (
    <form
      className="create-account"
      onSubmit={async (ev) => {
        ev.preventDefault();
        const errors = new Map<MnemonicFormElements, string>();
        const data = new FormData(ev.currentTarget);
        const mnemonic = String(data.get("mnemonic"));
        try {
          await mnemonicToSeed(mnemonic);
        } catch (e) {
          errors.set("mnemonic", "Invalid mnemonic.");
          console.error(e);
        }

        setErrors(errors);
        if (errors.size === 0) {
          navigate("/create-wallet/step-3", { state: { ...location.state, mnemonic } });
        }
      }}
    >
      <CreateAccountHeader title="Copy Secret Recovery Phrase" />
      <div className="create-account__progress">
        <div className="create-account__progress--active" style={{ width: "66%" }}></div>
      </div>

      <div className="pad-24 t-medium-small">
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          Copy the phrase & store it safely or memorize it. Never disclose your Secret Recovery Phrase. Anyone with this
          phrase can take your Alphabill forever.
        </div>

        <Form>
          <FormContent>
            <TextAreaField
              name="mnemonic"
              label="Secret Recovery Phrase"
              value={mnemonic}
              error={errors.get("mnemonic")}
            />
          </FormContent>
          <FormFooter>
            <Button type="button" variant="secondary" big={true} block={true}>
              <CopyIcon fill="#FFFFFF" />
              <div style={{ marginLeft: "5px" }}>Copy</div>
            </Button>
          </FormFooter>
        </Form>
      </div>
      <CreateAccountFooter
        previousLabel="Back"
        nextLabel="Next"
        onPrevious={() => navigate("/create-wallet", { state: location.state })}
      />
    </form>
  );
}

type KeyPageFormElements = "keyLabel";
export function CreateAccountKeyPage(): ReactElement {
  const location: ILocation<IAccountState | undefined> = useLocation();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Map<KeyPageFormElements, string>>(new Map());

  return (
    <form
      className="create-account"
      onSubmit={(ev) => {
        ev.preventDefault();
        console.log("Create wallet");
      }}
    >
      <CreateAccountHeader title="Create Your Key" />
      <div className="create-account__progress">
        <div className="create-account__progress--active" style={{ width: "100%" }}></div>
      </div>

      <div className="pad-24 t-medium-small">
        <Form>
          <FormContent>
            <TextField name="key" label="Key" value="asd" error={undefined} disabled />
            <TextField name="keyLabel" label="Key name" error={undefined} focusInput />
          </FormContent>
        </Form>
      </div>
      <CreateAccountFooter
        previousLabel="Back"
        nextLabel="Create wallet"
        onPrevious={() => navigate("/create-wallet/step-2", { state: location.state })}
      />
    </form>
  );
}

// {/*<Formik*/}
//         {/*  initialValues={{*/}
//         {/*    mnemonic: "",*/}
//         {/*    password: "",*/}
//         {/*    passwordConfirm: "",*/}
//         {/*  }}*/}
//         {/*  validationSchema={Yup.object().shape({*/}
//         {/*    password: Yup.string().test(*/}
//         {/*      "empty-or-8-characters-check",*/}
//         {/*      "password must be at least 8 characters",*/}
//         {/*      (password) => checkPassword(password),*/}
//         {/*    ),*/}
//         {/*    passwordConfirm: Yup.string().test(*/}
//         {/*      "empty-or-8-characters-check",*/}
//         {/*      "password must be at least 8 characters",*/}
//         {/*      (password) => checkPassword(password),*/}
//         {/*    ),*/}
//         {/*  })}*/}
//         {/*  onSubmit={(values, { setErrors }) => {*/}
//         {/*    if (values.password !== values.passwordConfirm) {*/}
//         {/*      return setErrors({ passwordConfirm: "Passwords don't match" });*/}
//         {/*    }*/}
//
//         {/*    const seed = mnemonicToSeedSync(mnemonic);*/}
//         {/*    const masterKey = HDKey.fromMasterSeed(seed);*/}
//         {/*    const hashingKey = masterKey.derive(`m/44'/634'/0'/0/0`);*/}
//         {/*    const hashingPubKey = hashingKey.publicKey;*/}
//         {/*    const prefixedHashingPubKey = unit8ToHexPrefixed(hashingPubKey!);*/}
//
//         {/*    const encrypted = CryptoJS.AES.encrypt(prefixedHashingPubKey, values.password).toString();*/}
//
//         {/*    const decrypted = CryptoJS.AES.decrypt(encrypted, values.password);*/}
//
//         {/*    if (prefixedHashingPubKey === decrypted.toString(CryptoJS.enc.Latin1)) {*/}
//         {/*      const vaultData = {*/}
//         {/*        entropy: mnemonicToEntropy(mnemonic),*/}
//         {/*        pub_keys: prefixedHashingPubKey,*/}
//         {/*      };*/}
//
//         {/*      clearStorage();*/}
//         {/*      login(*/}
//         {/*        prefixedHashingPubKey,*/}
//         {/*        prefixedHashingPubKey,*/}
//         {/*        CryptoJS.AES.encrypt(JSON.stringify(vaultData), values.password).toString(),*/}
//         {/*      );*/}
//         {/*    } else {*/}
//         {/*      return setErrors({*/}
//         {/*        passwordConfirm: "Public key creation failed",*/}
//         {/*      });*/}
//         {/*    }*/}
//         {/*  }}*/}
//         {/*>*/}
//         {/*  {(formikProps) => {*/}
//         {/*    const { handleSubmit, errors, touched } = formikProps;*/}
//
//         {/*    return (*/}
//
//         {/*<TextAreaField*/}
//         {/*  id="mnemonic"*/}
//         {/*  name="mnemonic"*/}
//         {/*  type="mnemonic"*/}
//         {/*  label="Secret Recovery Phrase"*/}
//         {/*  error={null}*/}
//         {/*  className="center"*/}
//         {/*  value={mnemonic}*/}
//         {/*  disabled*/}
//         {/*/>*/}
//
//         {/*    );*/}
//         {/*  }}*/}
//         {/*</Formik>*/}
