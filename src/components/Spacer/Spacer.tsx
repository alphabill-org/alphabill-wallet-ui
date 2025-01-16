import classNames from "classnames";
import { ReactElement } from "react";

export interface ISpacerProps {
  m?: number;
  mt?: number;
  mb?: number;
  ml?: number;
  mr?: number;
  isBorder?: boolean;
}

export function Spacer({ m, mt, mb, ml, mr, isBorder }: ISpacerProps): ReactElement {
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
