import classNames from "classnames";
import { ReactElement } from "react";

export interface ITextAreaFieldProps {
  label?: string;
  name?: string;
  className?: string;
  value?: string;
  error?: string;
  disabled?: boolean;
  rows?: number;
}

export function TextAreaField(props: ITextAreaFieldProps): ReactElement {
  const { label, name, rows, error, value, disabled } = props;

  const className = classNames("textfield", props.className);

  return (
    <div className={className} data-testid="textfield">
      <div className="textfield__inner">
        {label && <label className="textfield__label">{label}</label>}
        <textarea
          name={name}
          autoComplete="off"
          className="textfield__input"
          defaultValue={value}
          disabled={disabled}
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
