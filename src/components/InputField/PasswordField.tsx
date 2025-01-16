import { ReactElement, useEffect, useRef, useState } from "react";
import ShowIcon from "../../images/show-ico.svg?react";
import { Button } from "../Button/Button";
import { InputField } from "./InputField";

interface IPasswordFieldProps {
  label: string;
  name: string;
  error?: string;
  desc?: string;
  focusInput?: boolean;
  selectInput?: boolean;
  value?: string;
}

export function PasswordField(props: IPasswordFieldProps): ReactElement {
  const { error, focusInput, selectInput, label, desc, name, value } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (focusInput) {
      inputRef.current?.focus();
    }

    if (selectInput) {
      inputRef.current?.select();
    }
  }, [focusInput, selectInput]);

  return (
    <InputField className="textfield--password" label={label} desc={desc} error={error}>
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        ref={inputRef}
        autoComplete="off"
        className="textfield__input"
        defaultValue={value}
      />
      <Button onClick={() => setShowPassword(!showPassword)} type="button" variant="icon" className="toggle-password">
        <ShowIcon height="20" width="20" />
      </Button>
    </InputField>
  );
}
