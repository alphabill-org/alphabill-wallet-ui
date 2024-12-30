import classNames from "classnames";
import React from "react";

export interface ISpacerProps {
  m?: number;
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
  isBorder?: boolean;
}

export default function Spacer({ m, mt, mb, ml, mr, isBorder }: ISpacerProps): JSX.Element {
  const className = classNames("spacer", { "spacer--with-border": isBorder });

  return (
    <hr
      className={className}
      style={{
        margin: m,
        marginTop: mt,
        marginBottom: mb,
        marginLeft: ml,
        marginRight: mr,
      }}
      data-testid="spacer"
    />
  );
}
