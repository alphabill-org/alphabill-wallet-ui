import { FeeCreditRecord } from '@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord';
import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { FormEvent, ReactElement, useCallback, useMemo, useState } from 'react';

import { Button } from '../../components/Button/Button';
import { ErrorNotification } from '../../components/ErrorNotification/ErrorNotification';
import { FormContent } from '../../components/Form/components/FormContent';
import { FormFooter } from '../../components/Form/components/FormFooter';
import { Form } from '../../components/Form/Form';
import { Header } from '../../components/Header/Header';
import { TextField } from '../../components/InputField/TextField';
import { Loading } from '../../components/Loading/Loading';
import { SelectBox } from '../../components/SelectBox/SelectBox';
import { useAlphas } from '../../hooks/alpha';
import { useFeeCredits } from '../../hooks/feecredit';
import CheckIcon from '../../images/check-ico.svg?react';

type FormElements = 'alpha' | 'partition' | 'amount';

// TODO: Fix page design and code. Reset selected state when network is changed. Show network selection even when error occurs with queries
export function Fees(): ReactElement {
  const [errors, setErrors] = useState<Map<FormElements, string>>(new Map());
  const [selectedAlpha, setSelectedAlpha] = useState<Bill | undefined>(undefined);
  const [selectedFeeCredit, setSelectedFeeCredit] = useState<FeeCreditRecord | undefined>(undefined);
  const [selectedPartition, setSelectedPartition] = useState<PartitionIdentifier.MONEY | PartitionIdentifier.TOKEN>(
    PartitionIdentifier.MONEY,
  );
  const { alphas } = useAlphas();
  const { moneyFeeCredits, tokenFeeCredits } = useFeeCredits();

  const feeCredit = useMemo(() => {
    return selectedPartition === PartitionIdentifier.MONEY ? moneyFeeCredits : tokenFeeCredits;
  }, [selectedPartition, moneyFeeCredits, tokenFeeCredits]);

  const onSubmit = useCallback(
    (ev: FormEvent<HTMLFormElement>) => {
      ev.preventDefault();

      const errors = new Map<FormElements, string>();
      const data = new FormData(ev.currentTarget);
      const amount = Number(data.get('amount'));
      if (!selectedAlpha) {
        errors.set('alpha', 'Alpha is not selected.');
      }

      if (!amount || amount <= 0) {
        errors.set('amount', 'Invalid amount.');
      }

      if (selectedAlpha && selectedAlpha.value < amount) {
        errors.set('amount', 'Alpha does not have enough balance.');
      }

      setErrors(errors);
      if (errors.size === 0) {
        console.log('submit');
      }
    },
    [selectedAlpha, setErrors],
  );

  if (alphas.isPending || feeCredit.isPending) {
    return (
      <div className="fees--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (alphas.isError || feeCredit.isError) {
    const error = alphas.error || feeCredit.error;
    return (
      <div className="fees--error">
        <ErrorNotification title="Error occurred" info={error?.message} />
      </div>
    );
  }

  return (
    <form className="fees" onSubmit={onSubmit}>
      <Header />
      <Form>
        <FormContent>
          <SelectBox
            label="Alphas"
            title="SELECT ALPHA"
            data={alphas.data}
            selectedItem={selectedAlpha?.unitId.toString()}
            select={(unit: Bill) => setSelectedAlpha(unit)}
            getOptionKey={(unit: Bill) => unit.unitId.toString()}
            createOption={(unit: Bill) => (
              <>
                <div className="select__option--text">{unit.unitId.toString()}</div>
                {selectedAlpha?.unitId.toString() === unit.unitId.toString() ? <CheckIcon /> : null}
              </>
            )}
          />
          {errors.get('alpha') && <span className="textfield__error">{errors.get('alpha')}</span>}
          <div>
            <div
              onClick={(ev) => {
                ev.stopPropagation();
                setSelectedPartition(PartitionIdentifier.MONEY);
                setSelectedFeeCredit(undefined);
              }}
            >
              Money partition {selectedPartition === PartitionIdentifier.MONEY ? '(selected)' : null}
            </div>
            <div
              onClick={(ev) => {
                ev.stopPropagation();
                setSelectedPartition(PartitionIdentifier.TOKEN);
                setSelectedFeeCredit(undefined);
              }}
            >
              Token partition {selectedPartition === PartitionIdentifier.TOKEN ? '(selected)' : null}
            </div>
          </div>
          <SelectBox
            label="Fee credit (optional)"
            title="SELECT FEE CREDIT"
            data={feeCredit.data}
            selectedItem={selectedFeeCredit?.unitId.toString()}
            select={(unit: FeeCreditRecord) => setSelectedFeeCredit(unit)}
            getOptionKey={(unit: FeeCreditRecord) => unit.unitId.toString()}
            createOption={(unit: FeeCreditRecord) => (
              <>
                <div className="select__option--text">{unit.unitId.toString()}</div>
                {selectedFeeCredit?.unitId.toString() === unit.unitId.toString() ? <CheckIcon /> : null}
              </>
            )}
          />
          <TextField name="amount" label="Amount to transfer" error={errors.get('amount')} />
        </FormContent>
        <FormFooter>
          <Button block={true} type="submit" variant="primary">
            Add
          </Button>
        </FormFooter>
      </Form>
    </form>
  );
}
