import { PropsWithChildren, ReactElement } from "react";

export function FormFooter(props: PropsWithChildren): ReactElement {
  return <div className="form-footer">{props.children}</div>;
}
