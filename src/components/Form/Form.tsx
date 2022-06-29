import React from 'react';

import classNames from 'classnames';

import FormContent from './components/FormContent';
import FormHeader from './components/FormHeader';
import FormFooter from './components/FormFooter';

export interface IFormProps {
  children: React.ReactNode;
  dark?: boolean;
}

function Form(props: IFormProps): JSX.Element {
  const className = classNames('form', { 'form--dark': props.dark });

  return <div className={className}>{props.children}</div>;
}

export { FormContent, FormHeader, FormFooter, Form };
