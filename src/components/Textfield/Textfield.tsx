import React, { useEffect, useRef } from "react";

import classNames from "classnames";
import { useField, useFormikContext } from "formik";

export interface ITextfieldProps {
  id: string;
  label: string;
  name?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>, name: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  value?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  hiddenPassword?: boolean;
  autoComplete?: string;
  readOnly?: boolean;
  transparent?: boolean;
  error?: string | string[];
  disabled?: boolean;
  pattern?: string;
  floatingFixedPoint?: number;
  isNumberFloat?: boolean;
  min?: string;
  max?: string;
  maxLength?: number;
  desc?: string;
  removeApostrophes?: boolean;
  focusInput?: boolean;
  selectInput?: boolean;
}

export default function Textfield(props: ITextfieldProps): JSX.Element {
  const {
    hiddenPassword,
    error,
    transparent,
    floatingFixedPoint,
    isNumberFloat,
    removeApostrophes,
    focusInput,
    selectInput,
    ...inputProps
  } = props;
  const { setFieldValue, handleBlur } = useFormikContext();
  const [field] = useField(props as any);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (field.value !== props.value && props.value) {
      setFieldValue(field.name, props.value);
    }
  }, [field.value, props.value, setFieldValue, field.name]);


  useEffect(() => {
    if (focusInput) {
        inputRef.current?.focus();
    }

    if (selectInput) {
      inputRef.current?.select();
    }
  }, [focusInput, selectInput]);

  const className = classNames(
    "textfield",
    {
      "textfield--hidden-password": hiddenPassword,
      "textfield--error": error,
      "textfield--transparent": transparent,
    },
    props.className
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const regexNumber = /^[+-]?\d*(?:[.,]\d*)?$/;
    const regexEmoji = /[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu;
    const fixedPoint = props.floatingFixedPoint || "2";
    const regexFloatString = "^\\d+(\\.\\d{0," + fixedPoint + "})?$";
    const regexFloat = new RegExp(regexFloatString);
    let value = e.target.value;

    if (props.type !== "password" && regexEmoji.test(value)) {
      return false;
    }

    if (props.removeApostrophes) {
      value = value.replace(/'/g, "");
    }

    if (
      props.isNumberFloat &&
      value !== "" &&
      (!regexNumber.test(value) || !regexFloat.test(value))
    ) {
      return false;
    }

    if (props.onChange) {
      props.onChange(e, field.name);
    } else {
      setFieldValue(field.name, value);
    }
  };

  return (
    <div className={className} data-testid="textfield">
      <div className="textfield__inner">
        {props.label && (
          <label className="textfield__label">{props.label}</label>
        )}
        <input
          {...inputProps}
          ref={inputRef}
          autoComplete="off"
          onChange={handleChange}
          onBlur={handleBlur}
          value={
            field.value
              ? props.type === "number"
                ? Math.max(0, field.value)
                : field.value
              : props.value || ""
          }
          className="textfield__input"
          onKeyDown={
            props.type === "number"
              ? (evt) =>
                  ["e", "E", "+", "-", ",", "."].includes(evt.key) &&
                  evt.preventDefault()
              : undefined
          }
          min={props.type === "number" ? 0 : undefined}
          maxLength={props?.maxLength}
          step={props.type === "number" ? props.step : undefined}
        />
        {props.desc && <span className="t-small pad-4-l">{props.desc}</span>}
      </div>
      {error && error.length > 0 && (
        <span data-testid="textfield__error" className="textfield__error">
          {error}
        </span>
      )}
    </div>
  );
}
