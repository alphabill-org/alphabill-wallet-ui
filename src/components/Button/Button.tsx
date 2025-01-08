import classNames from "classnames";
import React, { ReactElement, useEffect, useState } from "react";

import Spinner from "../Spinner/Spinner";

export interface IButtonProps {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  variant?: "primary" | "secondary" | "third" | "link" | "icon";
  working?: boolean;
  workingText?: string;
  brand?: "mastercard" | "visa" | "apple-pay" | "discover";
  block?: boolean;
  big?: boolean;
  small?: boolean;
  xSmall?: boolean;
  url?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  target?: string;
  isBordered?: boolean;
  isActive?: boolean;
  id?: string;
  tooltipContent?: string;
  tooltipPlacement?: "top" | "left" | "right" | "bottom";
}

export default function Button(props: IButtonProps): ReactElement {
  const className = classNames(
    "button",
    {
      [`button--${props.variant}`]: props.variant,
      "button--big": props.big,
      "button--small": props.small,
      "button--x-small": props.xSmall,
      "button--block": props.block,
      "button--working": props.working,
      "is--bordered": props.isBordered,
      "is--active": props.isActive,
      [`button--${props.brand}`]: props.brand,
    },
    props.className,
  );

  const [isTooltipOpen, setIsTooltipOpen] = useState<boolean>(false);

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (props.onClick) {
      props.onClick(event);
      props.tooltipContent && setIsTooltipOpen(true);
    }
  };

  useEffect(() => {
    if (isTooltipOpen === true) {
      setTimeout(() => {
        setIsTooltipOpen(false);
      }, 1000);
    }
  }, [isTooltipOpen]);

  const TagName = props.url ? "a" : "button";

  return (
    <>
      {props.tooltipContent && (
        <div className="tooltip" style={{ position: "relative", display: isTooltipOpen ? "block" : "none" }}>
          {props.tooltipContent}
        </div>
      )}
      <TagName
        {...(props.target && { target: props.target })}
        className={className}
        onClick={handleButtonClick}
        type={props.type}
        disabled={props.disabled}
        href={props.url ? props.url : undefined}
        id={props.id}
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
    </>
  );
}
