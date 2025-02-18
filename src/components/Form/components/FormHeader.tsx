import { PropsWithChildren, ReactElement } from 'react';

export function FormHeader(props: PropsWithChildren): ReactElement {
  return <div className="form-header">{props.children}</div>;
}
