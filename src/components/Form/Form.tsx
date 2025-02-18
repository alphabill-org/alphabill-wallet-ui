import { PropsWithChildren, ReactElement } from 'react';

import { FormContent } from './components/FormContent';
import { FormFooter } from './components/FormFooter';
import { FormHeader } from './components/FormHeader';

function Form({ children }: PropsWithChildren): ReactElement {
  return <div className="form">{children}</div>;
}

export { FormContent, FormHeader, FormFooter, Form };
