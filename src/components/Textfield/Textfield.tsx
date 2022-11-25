import React, { useEffect } from "react";

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
  floatingFixedPoint?: string;
  isNumberFloat?: boolean;
  min?: string;
  max?: string;
}

export default function Textfield(props: ITextfieldProps): JSX.Element {
  const {
    hiddenPassword,
    error,
    transparent,
    floatingFixedPoint,
    isNumberFloat,
    ...inputProps
  } = props;
  const { setFieldValue, handleBlur } = useFormikContext();
  const [field] = useField(props as any);

  useEffect(() => {
    if (field.value !== props.value && props.value) {
      setFieldValue(field.name, props.value);
    }
  }, [field.value, props.value, setFieldValue, field.name]);

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
    const fixedPoint = props.floatingFixedPoint || "2";
    const regexFloatString = "^\\d+(\\.\\d{0," + fixedPoint + "})?$";
    const regexFloat = new RegExp(regexFloatString);

    if (
      props.isNumberFloat &&
      e.target.value !== "" &&
      (!regexNumber.test(e.target.value) || !regexFloat.test(e.target.value))
    ) {
      return false;
    }

    if (props.onChange) {
      props.onChange(e, field.name);
    } else {
      setFieldValue(field.name, e.target.value);
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
                  ["e", "E", "+", "-"].includes(evt.key) &&
                  evt.preventDefault()
              : undefined
          }
          min={props.type === "number" ? 0 : undefined}
          step={props.type === "number" ? props.step : undefined}
        />
      </div>
      {error && error.length > 0 && (
        <span data-testid="textfield__error" className="textfield__error">
          {error}
        </span>
      )}
    </div>
  );
}
