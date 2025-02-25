import { FormEvent, ReactElement, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button/Button';
import { FormContent, FormFooter } from '../../components/Form/Form';
import { PasswordField } from '../../components/InputField/PasswordField';
import { TextField } from '../../components/InputField/TextField';
import { Navbar } from '../../components/NavBar/NavBar';
import { useVault } from '../../hooks/vaultContext';

type FormElements = 'alias' | 'password';

export function AddKey(): ReactElement {
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());
  const navigate = useNavigate();
  const vault = useVault();

  const onSubmit = useCallback(
    async (ev: FormEvent<HTMLFormElement>): Promise<void> => {
      ev.preventDefault();
      const errors = new Map<FormElements, string>();
      const data = new FormData(ev.currentTarget);
      const alias = String(data.get('alias') ?? '');
      if (alias.length === 0) {
        errors.set('alias', 'Invalid alias.');
      }

      const password = String(data.get('password') ?? '');
      try {
        await vault.addKey(alias, password);
      } catch (e) {
        errors.set('password', e instanceof Error ? e.message : String(e));
      }

      setErrors(errors);

      if (errors.size === 0) {
        navigate(-1);
      }
    },
    [setErrors],
  );

  return (
    <>
      <Navbar title="Add Key" />
      <div className="add_key__content">
        <form className="add_key__form" onSubmit={onSubmit}>
          <FormContent>
            <TextField name="alias" label="Key name" error={errors.get('alias')} focusInput />
            <PasswordField name="password" label="Password" error={errors.get('password')} />
          </FormContent>
          <FormFooter>
            <Button block={true} type="submit" variant="primary">
              Add
            </Button>
          </FormFooter>
        </form>
      </div>
    </>
  );
}
