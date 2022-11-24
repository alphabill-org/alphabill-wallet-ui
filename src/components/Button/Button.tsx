import React from "react";

import classNames from "classnames";

import Spinner from "../Spinner/Spinner";

export interface IButtonProps {
  children?: React.ReactNode;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => void;
  variant?: "primary" | "secondary" | "third" | "link" | "icon";
  working?: boolean;
  workingText?: string;
  brand?: "mastercard" | "visa" | "apple-pay" | "discover";
  block?: boolean;
  big?: boolean;
  small?: boolean;
  url?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  target?: string;
  isBordered?: boolean;
  isActive?: boolean;
}

export default function Button(props: IButtonProps): JSX.Element {
  const className = classNames(
    "button",
    {
      [`button--${props.variant}`]: props.variant,
      "button--big": props.big,
      "button--small": props.small,
      "button--block": props.block,
      "button--working": props.working,
      "is--bordered": props.isBordered,
      "is--active": props.isActive,
      [`button--${props.brand}`]: props.brand,
    },
    props.className
  );

  const handleButtonClick = (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    if (props.onClick) {
      props.onClick(event);
    }
  };

  const TagName = props.url ? "a" : "button";

  return (
    <TagName
      {...(props.target && { target: props.target })}
      className={className}
      onClick={handleButtonClick}
      type={props.type}
      disabled={props.disabled}
      href={props.url ? props.url : undefined}
    >
      {props.working && props.workingText ? (
        props.workingText
      ) : props.working ? (
        <>
          <div>{props.children}</div> <Spinner />
        </>
      ) : (
        props.children
      )}
    </TagName>
  );
}
