import { ReactElement, ReactNode } from "react";

export interface IFormContentProps {
  children: ReactNode;
}

export default function FormContent(props: IFormContentProps): ReactElement {
  return <div className="form-content">{props.children}</div>;
}
