import React from 'react';

import { CircularProgress } from '@material-ui/core';
import classNames from 'classnames';

export interface ISpinnerProps {
  absolute?: boolean;
  className?: string;
}

export default function Spinner(props: ISpinnerProps) {
  const className = classNames('spinner', { 'spinner--absolute': props.absolute }, props.className);

  return (
    <div className={className}>
      <CircularProgress />
    </div>
  );
}
