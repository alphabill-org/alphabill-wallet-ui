import { IBill } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import Spacer from "../../Spacer/Spacer";

function BillsList(): JSX.Element | null {
  const { billsList } = useApp();
  let denomination: number | null = null;
  return (
    <div className="dashboard__info-col active relative">
      <Spacer mt={16} />
      <h4 className="pad-24-h">Total of {billsList.bills.length} bills</h4>
      <Spacer mt={16} />
      {billsList?.bills
        ?.sort((a: IBill, b: IBill) => Number(a.value) - Number(b.value))
        .map((bill: IBill, idx: number) => {
          const isNewDenomination = denomination != bill.value && true;
          const amountOfGivenDenomination = billsList?.bills.filter(
            (b: IBill) => b.value === bill.value
          ).length;
          denomination = bill.value;

          return (
            <>
              {isNewDenomination && (
                <>
                  {idx !== 0 && <Spacer mt={24} />}
                  <div className="t-regular pad-24-h">
                    Denomination: {bill.value} - total of{" "}
                    {amountOfGivenDenomination}
                  </div>
                  <Spacer mt={4} />
                </>
              )}
              <div key={bill.id} className="dashboard__info-item-wrap small">
                <div className="dashboard__info-item-bill">
                  <div className="flex t-small c-light">
                    <span className="pad-8-r">ID:</span> <span>{bill.id}</span>
                  </div>
                </div>
              </div>
            </>
          );
        })}
    </div>
  );
}

export default BillsList;
