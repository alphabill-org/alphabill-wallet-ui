import classNames from "classnames";
import { ReactElement, ReactNode } from "react";
import { FormContent } from "./components/FormContent";
import { FormFooter } from "./components/FormFooter";
import { FormHeader } from "./components/FormHeader";

export interface IFormProps {
  children: ReactNode;
  dark?: boolean;
}

function Form(props: IFormProps): ReactElement {
  const className = classNames("form", { "form--dark": props.dark });

  return <div className={className}>{props.children}</div>;
}

export { FormContent, FormHeader, FormFooter, Form };
