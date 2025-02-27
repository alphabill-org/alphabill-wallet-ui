import classNames from 'classnames';
import { PropsWithChildren, ReactElement } from 'react';

interface IInputFieldProps {
  readonly label: string;
  readonly className?: string;
  readonly error?: string;
  readonly desc?: string;
}

export function InputField(props: PropsWithChildren<IInputFieldProps>): ReactElement {
  const { error, children } = props;

  const className = classNames('textfield', props.className);

  return (
    <div className={className} data-testid="textfield">
      <div className="textfield__inner">
        {props.label && <label className="textfield__label">{props.label}</label>}
        <div className="textfield__input--wrap">{children}</div>
        {props.desc && <span className="t-small pad-4-l">{props.desc}</span>}
      </div>
      {error && (
        <span data-testid="textfield__error" className="textfield__error">
          {error}
        </span>
      )}
    </div>
  );
}
