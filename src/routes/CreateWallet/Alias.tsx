import { FormEvent, ReactElement, useCallback, useState } from 'react';

import { Footer } from './Footer';
import { Header } from './Header';
import { Progress } from './Progress';
import { Form, FormContent } from '../../components/Form/Form';
import { TextField } from '../../components/InputField/TextField';

type FormElements = 'alias';

export function Alias({
  publicKey,
  onSubmitSuccess,
  previous,
}: {
  publicKey: string;
  onSubmitSuccess: (alias: string) => Promise<void>;
  previous: () => void;
}): ReactElement {
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  const onSubmit = useCallback(
    async (ev: FormEvent<HTMLFormElement>): Promise<void> => {
      ev.preventDefault();
      const errors = new Map<FormElements, string>();
      const data = new FormData(ev.currentTarget);
      const alias = String(data.get('alias') ?? '');
      if (alias.length === 0) {
        errors.set('alias', 'Invalid alias.');
      }

      setErrors(errors);
      if (errors.size === 0) {
        await onSubmitSuccess(alias);
      }
    },
    [setErrors, onSubmitSuccess],
  );

  return (
    <form className="create-account" onSubmit={onSubmit}>
      <Header title="Create Your Key" />
      <Progress step={3} total={3} />
      <div className="pad-24 t-medium-small">
        <Form>
          <FormContent>
            <TextField name="key" label="Key" value={publicKey} disabled />
            <TextField name="alias" label="Key name" error={errors.get('alias')} focusInput />
          </FormContent>
        </Form>
      </div>
      <Footer nextLabel="Create wallet" previous={previous} />
    </form>
  );
}
