import { PropsWithChildren, ReactElement } from 'react';

export function FormContent(props: PropsWithChildren): ReactElement {
  return <div className="form-content">{props.children}</div>;
}
