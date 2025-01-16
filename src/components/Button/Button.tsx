import classNames from "classnames";
import { MouseEvent, ReactElement, ReactNode } from "react";

export interface IButtonProps {
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  variant?: "primary" | "secondary" | "third" | "link" | "icon";
  block?: boolean;
  small?: boolean;
  xSmall?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  isBordered?: boolean;
  isActive?: boolean;
}

export default function Button(props: IButtonProps): ReactElement {
  const className = classNames(
    "button",
    {
      [`button--${props.variant}`]: props.variant,
      "button--small": props.small,
      "button--x-small": props.xSmall,
      "button--block": props.block,
      "is--bordered": props.isBordered,
      "is--active": props.isActive,
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
