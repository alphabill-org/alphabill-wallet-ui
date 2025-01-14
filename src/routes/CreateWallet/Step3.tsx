import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { ReactElement, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Form, FormContent } from "../../components/Form/Form";
import { TextField } from "../../components/InputField/TextField";
import { useVault } from "../../hooks/vault";
import { ICreateWalletContext } from "./CreateWallet";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Progress } from "./Progress";
import { Step1 } from "./Step1";
import { Step2 } from "./Step2";

type FormElements = "alias";
export function Step3(): ReactElement {
  const vault = useVault();
  const navigate = useNavigate();
  const context = useOutletContext<ICreateWalletContext | null>();
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  if (!context) {
    throw new Error("Invalid create wallet context");
  }

  if (!context.password) {
    return <Step1 />;
  }

  if (!context.key) {
    return <Step2 />;
  }

  const key = useMemo(() => Base16Converter.encode(context.key?.initialKey.publicKey ?? new Uint8Array()), [context]);

  return (
    <form
      className="create-account"
      onSubmit={async (ev) => {
        ev.preventDefault();
        const errors = new Map<FormElements, string>();
        const data = new FormData(ev.currentTarget);
        const alias = String(data.get("alias") ?? "");
        if (alias.length === 0) {
          errors.set("alias", "Invalid alias.");
        }

        setErrors(errors);
        if (errors.size === 0) {
          await vault.createVault(context.key.mnemonic, context.password, {
            alias,
            index: 0,
          });

          navigate("/");
        }
      }}
    >
      <Header title="Create Your Key" />
      <Progress step={3} total={3} />
      <div className="pad-24 t-medium-small">
        <Form>
          <FormContent>
            <TextField name="key" label="Key" value={key} disabled />
            <TextField name="alias" label="Key name" error={errors.get("alias")} focusInput />
          </FormContent>
        </Form>
      </div>
      <Footer nextLabel="Create wallet" previousPage="/create-wallet/step-2" />
    </form>
  );
}
