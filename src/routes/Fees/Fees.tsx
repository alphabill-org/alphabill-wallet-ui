import { FeeCreditRecord } from '@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord';
import { Bill } from '@alphabill/alphabill-js-sdk/lib/money/Bill';
import { ReactElement, useState } from 'react';

import { ErrorNotification } from '../../components/ErrorNotification/ErrorNotification';
import { Header } from '../../components/Header/Header';
import { TextField } from '../../components/InputField/TextField';
import { Loading } from '../../components/Loading/Loading';
import { SelectBox } from '../../components/SelectBox/SelectBox';
import { useAlphas } from '../../hooks/alpha';
import { useFeeCredits } from '../../hooks/feecredit';
import CheckIcon from '../../images/check-ico.svg?react';

export function Fees(): ReactElement {
  const [selectedAlpha, setSelectedAlpha] = useState<Bill | undefined>(undefined);
  const [selectedFeeCredit, setSelectedFeeCredit] = useState<FeeCreditRecord | undefined>(undefined);
  const { alpha } = useAlphas();
  const { feeCredit } = useFeeCredits();

  if (alpha.isPending || feeCredit.isPending) {
    return (
      <div className="fees--loading">
        <Loading title="Loading..." />
      </div>
    );
  }

  if (alpha.isError || feeCredit.isError) {
    const error = alpha.error || feeCredit.error;
    return (
      <div className="fees--error">
        <ErrorNotification title="Error occurred" info={error?.message} />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="fees">
        <div>
          <SelectBox
            label="Alphas"
            title="SELECT ALPHA"
            data={alpha.data.units}
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
        </div>
        <div></div>
        <div>
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
        </div>
        <div>
          <TextField name="amount" label="Amount to transfer" error={undefined} />
        </div>
      </div>
    </>
  );
}
