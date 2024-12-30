import classNames from "classnames";

import { useField, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";

export interface ITextAreaFieldProps {
  id: string;
  label?: string;
  name?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>, name: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  value?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  readOnly?: boolean;
  transparent?: boolean;
  error?: string | string[];
  disabled?: boolean;
  rows?: number;
}

export default function TextAreaField(props: ITextAreaFieldProps): JSX.Element {
  const { value, rows, error, transparent, ...textAreaProps } = props;
  const { setFieldValue, handleBlur } = useFormikContext();
  const [isChanged, setIsChanged] = useState(false);
  const [field] = useField(props as any);

  useEffect(() => {
    setFieldValue(field.name, value);
  }, [field.name, value, setFieldValue]);

  const className = classNames(
    "textfield",
    {
      "textfield--error": error,
      "textfield--transparent": transparent,
    },
    props.className,
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    props.onChange?.(e, field.name);
    setFieldValue(field.name, e.target.value);
    setIsChanged(true);
  };

  return (
    <div className={className} data-testid="textfield">
      <div className="textfield__inner">
        {props.label && <label className="textfield__label">{props.label}</label>}
        <textarea
          {...textAreaProps}
          autoComplete="off"
          onChange={handleChange}
          onBlur={handleBlur}
          value={isChanged ? field.value : value || field.value}
          className="textfield__input"
          rows={rows || 2}
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
