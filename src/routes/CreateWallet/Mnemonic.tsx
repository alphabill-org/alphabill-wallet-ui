import { FormEvent, ReactElement, useCallback, useRef, useState } from 'react';

import { Footer } from './Footer';
import { Header } from './Header';
import { Progress } from './Progress';
import { Button } from '../../components/Button/Button';
import { Form, FormContent, FormFooter } from '../../components/Form/Form';
import { InputField } from '../../components/InputField/InputField';
import CopyIcon from '../../images/copy-ico.svg?react';

type FormElements = 'mnemonic';

export function Mnemonic({
  mnemonic,
  onSubmitSuccess,
  previous,
}: {
  mnemonic?: string;
  previous: () => void;
  onSubmitSuccess: (mnemonic: string) => Promise<void>;
}): ReactElement | null {
  const mnemonicInputField = useRef<HTMLTextAreaElement | null>(null);
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());

  const onSubmit = useCallback(
    async (ev: FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      const errors = new Map<FormElements, string>();
      const data = new FormData(ev.currentTarget);
      const mnemonic = String(data.get('mnemonic'));
      if (mnemonic.split(' ').length !== 12) {
        errors.set('mnemonic', 'Invalid mnemonic.');
      }

      setErrors(errors);
      if (errors.size === 0) {
        await onSubmitSuccess(mnemonic);
      }
    },
    [setErrors, onSubmitSuccess],
  );

  return (
    <form className="create-account" onSubmit={onSubmit}>
      <Header title="Copy Secret Recovery Phrase" />
      <Progress step={2} total={3} />
      <div className="pad-24 t-medium-small">
        <div className="create-account__info">
          Copy the phrase & store it safely or memorize it. Never disclose your Secret Recovery Phrase. Anyone with this
          phrase can take your Alphabill forever.
        </div>

        <Form>
          <FormContent>
            <InputField label="Secret Recovery Phrase" error={errors.get('mnemonic')}>
              <textarea
                ref={mnemonicInputField}
                name="mnemonic"
                defaultValue={mnemonic}
                autoComplete="off"
                className="textfield__input"
              />
            </InputField>
          </FormContent>
          <FormFooter>
            <Button
              type="button"
              variant="secondary"
              block={true}
              onClick={async () => {
                await navigator.clipboard.writeText(mnemonicInputField.current?.value ?? '');
              }}
            >
              <CopyIcon fill="#FFFFFF" />
              <div style={{ marginLeft: '5px' }}>Copy</div>
            </Button>
          </FormFooter>
        </Form>
      </div>
      <Footer previous={previous} />
    </form>
  );
}
