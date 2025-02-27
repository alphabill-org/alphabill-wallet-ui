import { FormEvent, ReactElement, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button/Button';
import { FormContent, FormFooter } from '../../components/Form/Form';
import { TextField } from '../../components/InputField/TextField';
import { Navbar } from '../../components/NavBar/NavBar';
import { useNetwork } from '../../hooks/networkContext';

type FormElements = 'alias' | 'networkId' | 'moneyPartitionUrl' | 'tokenPartitionUrl';

export function Network(): ReactElement {
  const networkContext = useNetwork();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  const onSubmit = useCallback(
    (ev: FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      const errors = new Map<FormElements, string>();
      const data = new FormData(ev.currentTarget);
      try {
        new URL(data.get('moneyPartitionUrl') as string);
      } catch (e) {
        console.error(e);
        errors.set('moneyPartitionUrl', 'Invalid money partition URL.');
      }

      try {
        new URL(data.get('tokenPartitionUrl') as string);
      } catch (e) {
        console.error(e);
        errors.set('tokenPartitionUrl', 'Invalid token partition URL.');
      }

      if (!/^\d+$/.test(String(data.get('networkId')))) {
        errors.set('networkId', 'Network ID must be a number.');
      }

      if (!data.get('alias')) {
        errors.set('alias', 'Alias must be defined.');
      }

      setErrors(errors);

      if (errors.size === 0) {
        networkContext.addNetwork({
          alias: data.get('alias') as string,
          moneyPartitionUrl: data.get('moneyPartitionUrl') as string,
          networkId: Number(data.get('networkId')),
          tokenPartitionUrl: data.get('tokenPartitionUrl') as string,
        });

        navigate(-1);
        ev.currentTarget.reset();
      }
    },
    [networkContext, setErrors],
  );

  return (
    <>
      <Navbar title="Create network" />
      <div className="network__content">
        <form className="network__form" onSubmit={onSubmit}>
          <FormContent>
            <TextField label="Alias" name="alias" error={errors.get('alias')} focusInput />
            <TextField label="Network ID" name="networkId" error={errors.get('networkId')} />
            <TextField label="Money partition" name="moneyPartitionUrl" error={errors.get('moneyPartitionUrl')} />
            <TextField label="Token partition" name="tokenPartitionUrl" error={errors.get('tokenPartitionUrl')} />
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
