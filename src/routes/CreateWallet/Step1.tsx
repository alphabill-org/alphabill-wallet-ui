import { ReactElement, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Form, FormContent } from "../../components/Form/Form";
import PasswordField from "../../components/InputField/PasswordField";
import { ICreateWalletContext } from "./CreateWallet";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Progress } from "./Progress";

type FormElements = "password" | "passwordConfirmation";
export function Step1(): ReactElement {
  const navigate = useNavigate();
  const context = useOutletContext<ICreateWalletContext | null>();
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  if (!context) {
    throw new Error("Invalid create wallet context");
  }

  return (
    <form
      className="create-account"
      onSubmit={(ev) => {
        ev.preventDefault();
        const errors = new Map<FormElements, string>();
        const data = new FormData(ev.currentTarget);
        const password = String(data.get("password") ?? "");
        const passwordConfirmation = String(data.get("passwordConfirmation") ?? "");

        if (password.length < 8) {
          errors.set("password", "Password must be at least 8 characters long.");
        }

        if (password !== passwordConfirmation) {
          errors.set("passwordConfirmation", "Passwords did not match.");
        }

        if (errors.size === 0) {
          context.setPassword(password);
          navigate("/create-wallet/step-2");
        }

        setErrors(errors);
      }}
    >
      <Header title="Create Password" />
      <Progress step={1} total={3} />
      <div className="pad-24 t-medium-small">
        <Form>
          <FormContent>
            <PasswordField
              name="password"
              label="Password"
              value={context.password ?? ""}
              error={errors.get("password")}
              focusInput
            />
            <PasswordField
              name="passwordConfirmation"
              label="Confirm password"
              value={context.password ?? ""}
              error={errors.get("passwordConfirmation")}
            />
          </FormContent>
        </Form>
      </div>
      <Footer previousLabel="Cancel" previousPage="/" />
    </form>
  );
}
