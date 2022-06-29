import React from 'react';

export interface IFormFooterProps {
  children: React.ReactNode;
}

export default function FormFooter(props: IFormFooterProps): JSX.Element {
  return <div className="form-footer">{props.children}</div>;
}
