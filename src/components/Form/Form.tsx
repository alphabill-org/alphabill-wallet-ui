import React from 'react';

import classNames from 'classnames';

import FormContent from './components/FormContent';
import FormHeader from './components/FormHeader';
import FormFooter from './components/FormFooter';

export interface IFormProps {
  children: React.ReactNode;
  onSubmit: () => void;
  light?: boolean;
}

function Form(props: IFormProps): JSX.Element {
  const className = classNames('form', { 'form--light': props.light });

  return <form onSubmit={props.onSubmit} className={className}>{props.children}</form>;
}

export { FormContent, FormHeader, FormFooter, Form };
