import React from 'react';

export interface IFormHeaderProps {
  children: React.ReactNode;
}

export default function FormHeader(props: IFormHeaderProps): JSX.Element {
  return <div className="form-header">{props.children}</div>;
}
