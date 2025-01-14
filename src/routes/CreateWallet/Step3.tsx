import { ReactElement, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Form, FormContent } from "../../components/Form/Form";
import { TextField } from "../../components/InputField/TextField";
import { ICreateWalletContext } from "./CreateWallet";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Progress } from "./Progress";

type FormElements = "keyLabel";
export function Step3(): ReactElement {
  const navigate = useNavigate();
  const context = useOutletContext<ICreateWalletContext | null>();
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  if (!context) {
    throw new Error("Invalid create wallet context");
  }

  useEffect(() => {
    if (!context.password || !context.mnemonic) {
      navigate("/create-wallet/step-1");
    }
  }, []);

  return (
    <form
      className="create-account"
      onSubmit={(ev) => {
        ev.preventDefault();
        console.log("Create wallet");
      }}
    >
      <Header title="Create Your Key" />
      <Progress step={3} total={3} />
      <div className="pad-24 t-medium-small">
        <Form>
          <FormContent>
            <TextField name="key" label="Key" value="asd" error={undefined} disabled />
            <TextField name="keyLabel" label="Key name" error={undefined} focusInput />
          </FormContent>
        </Form>
      </div>
      <Footer nextLabel="Create wallet" previousPage="/create-wallet/step-2" />
    </form>
  );
}
