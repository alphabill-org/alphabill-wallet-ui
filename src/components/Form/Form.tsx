import classNames from "classnames";
import React from "react";

import FormContent from "./components/FormContent";
import FormFooter from "./components/FormFooter";
import FormHeader from "./components/FormHeader";

export interface IFormProps {
  children: React.ReactNode;
  dark?: boolean;
}

function Form(props: IFormProps): JSX.Element {
  const className = classNames("form", { "form--dark": props.dark });

  return <div className={className}>{props.children}</div>;
}

export { FormContent, FormHeader, FormFooter, Form };
