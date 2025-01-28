import { ReactElement, ReactNode } from 'react';

import ErrorIcon from '../../images/error.svg?react';

export function ErrorNotification({ title, info }: { title: string; info: ReactNode }): ReactElement {
  return (
    <div className="error_notification">
      <ErrorIcon />
      <h2>{title}</h2>
      <div>{info}</div>
    </div>
  );
}
