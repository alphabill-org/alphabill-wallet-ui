import { ReactElement, useEffect, useRef } from "react";
import InputField from "./InputField";

interface ITextFieldProps {
  label: string;
  name: string;
  error?: string;
  desc?: string;
  focusInput?: boolean;
  selectInput?: boolean;
}

export default function TextField(props: ITextFieldProps): ReactElement {
  const { error, focusInput, selectInput, label, desc, name } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusInput) {
      inputRef.current?.focus();
    }

    if (selectInput) {
      inputRef.current?.select();
    }
  }, [focusInput, selectInput]);

  return (
    <InputField label={label} desc={desc} error={error}>
      <input type="text" name={name} ref={inputRef} autoComplete="off" className="textfield__input" />
    </InputField>
  );
}
