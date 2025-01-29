import classNames from 'classnames';
import { MouseEvent, ReactElement, ReactNode } from 'react';

export interface IButtonProps {
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  variant?: 'primary' | 'secondary' | 'third' | 'link' | 'icon';
  block?: boolean;
  small?: boolean;
  xSmall?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  isRounded?: boolean;
  isActive?: boolean;
}

export function Button(props: IButtonProps): ReactElement {
  const className = classNames(
    'button',
    {
      [`button--${props.variant}`]: props.variant,
      'button--block': props.block,
      'button--small': props.small,
      'button--x-small': props.xSmall,
      'is--active': props.isActive,
      'is--rounded': props.isRounded,
    },
    props.className,
  );

  return (
    <>
      <button className={className} onClick={props.onClick} type={props.type} disabled={props.disabled}>
        {props.children}
      </button>
    </>
  );
}
