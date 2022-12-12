import classNames from 'classnames';

export interface ISpinnerProps {
  absolute?: boolean;
  className?: string;
}

export default function Spinner(props: ISpinnerProps) {
  const className = classNames('spinner', { 'spinner--absolute': props.absolute }, props.className);

  return (
    <div className={className}><span className="spinner__circle"></span></div>
  );
}
