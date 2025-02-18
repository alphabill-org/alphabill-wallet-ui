import { ReactElement, useEffect, useRef } from 'react';

import { InputField } from './InputField';

interface ITextFieldProps {
  readonly label: string;
  readonly name: string;
  readonly error?: string;
  readonly desc?: string;
  readonly value?: string;
  readonly disabled?: boolean;
  readonly focusInput?: boolean;
  readonly selectInput?: boolean;
}

export function TextField(props: ITextFieldProps): ReactElement {
  const { error, focusInput, selectInput, label, desc, name, value, disabled } = props;
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
      <input
        type="text"
        name={name}
        ref={inputRef}
        defaultValue={value}
        disabled={disabled}
        autoComplete="off"
        className="textfield__input"
      />
    </InputField>
  );
}
