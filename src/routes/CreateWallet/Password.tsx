import { FormEvent, ReactElement, useCallback, useState } from "react";
import { Form, FormContent } from "../../components/Form/Form";
import PasswordField from "../../components/InputField/PasswordField";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Progress } from "./Progress";

type FormElements = "password" | "passwordConfirmation";
export function Password({
  password,
  previous,
  onSubmitSuccess,
}: {
  password?: string;
  previous: () => void;
  onSubmitSuccess: (password: string) => void;
}): ReactElement {
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  const onSubmit = useCallback(
    (ev: FormEvent<HTMLFormElement>) => {
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

      setErrors(errors);
      if (errors.size === 0) {
        onSubmitSuccess(password);
      }
    },
    [setErrors, onSubmitSuccess],
  );

  return (
    <form className="create-account" onSubmit={onSubmit}>
      <Header title="Create Password" />
      <Progress step={1} total={3} />
      <div className="pad-24 t-medium-small">
        <Form>
          <FormContent>
            <PasswordField
              name="password"
              label="Password"
              value={password}
              error={errors.get("password")}
              focusInput
            />
            <PasswordField
              name="passwordConfirmation"
              label="Confirm password"
              value={password}
              error={errors.get("passwordConfirmation")}
            />
          </FormContent>
        </Form>
      </div>
      <Footer previousLabel="Cancel" previous={previous} />
    </form>
  );
}
