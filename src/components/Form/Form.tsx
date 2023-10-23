import React from 'react';

import classNames from 'classnames';

import FormContent from './components/FormContent';
import FormHeader from './components/FormHeader';
import FormFooter from './components/FormFooter';

export interface IFormProps {
  children: React.ReactNode;
  light?: boolean;
}

function Form(props: IFormProps): JSX.Element {
  const className = classNames('form', { 'form--light': props.light });

  return <div className={className}>{props.children}</div>;
}

export { FormContent, FormHeader, FormFooter, Form };
