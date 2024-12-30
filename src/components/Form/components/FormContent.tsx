import React from "react";

export interface IFormContentProps {
  children: React.ReactNode;
}

export default function FormContent(props: IFormContentProps): JSX.Element {
  return <div className="form-content">{props.children}</div>;
}
