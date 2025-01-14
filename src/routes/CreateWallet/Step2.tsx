import { generateMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import Button from "../../components/Button/Button";
import { Form, FormContent, FormFooter } from "../../components/Form/Form";
import { InputField } from "../../components/InputField/InputField";
import CopyIcon from "../../images/copy-ico.svg?react";
import { ICreateWalletContext } from "./CreateWallet";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Progress } from "./Progress";

type FormElements = "mnemonic";
export function Step2(): ReactElement | null {
  const navigate = useNavigate();
  const context = useOutletContext<ICreateWalletContext | null>();
  const mnemonicInputField = useRef<HTMLTextAreaElement | null>(null);
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  if (!context) {
    throw new Error("Invalid create wallet context");
  }

  useEffect(() => {
    if (!context.password) {
      navigate("/create-wallet/step-1");
    }
  }, []);

  const mnemonic = useMemo(() => context.mnemonic ?? generateMnemonic(wordlist), []);

  return (
    <form
      className="create-account"
      onSubmit={async (ev) => {
        ev.preventDefault();
        const errors = new Map<FormElements, string>();
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
          context.setMnemonic(mnemonic);
          navigate("/create-wallet/step-3");
        }
      }}
    >
      <Header title="Copy Secret Recovery Phrase" />
      <Progress step={2} total={3} />
      <div className="pad-24 t-medium-small">
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          Copy the phrase & store it safely or memorize it. Never disclose your Secret Recovery Phrase. Anyone with this
          phrase can take your Alphabill forever.
        </div>

        <Form>
          <FormContent>
            <InputField label="Secret Recovery Phrase" error={errors.get("mnemonic")}>
              <textarea
                ref={mnemonicInputField}
                name="mnemonic"
                defaultValue={mnemonic}
                autoComplete="off"
                className="textfield__input"
              />
            </InputField>
          </FormContent>
          <FormFooter>
            <Button
              type="button"
              variant="secondary"
              big={true}
              block={true}
              onClick={() => {
                navigator.clipboard.writeText(mnemonicInputField.current?.value ?? "");
              }}
            >
              <CopyIcon fill="#FFFFFF" />
              <div style={{ marginLeft: "5px" }}>Copy</div>
            </Button>
          </FormFooter>
        </Form>
      </div>
      <Footer previousPage="/create-wallet/step-1" />
    </form>
  );
}
