import { IBill } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import Spacer from "../../Spacer/Spacer";

function BillsList(): JSX.Element | null {
  const { billsList } = useApp();
  return (
    <div className="dashboard__info-col active relative">
      <Spacer mt={16} />
      <h4 className="pad-24-h">Total of {billsList.bills.length} bills</h4>
      <Spacer mt={8} />
      {billsList?.bills?.map((bill: IBill) => {
        return (
          <div key={bill.id} className="dashboard__info-item-wrap small">
            <div className="dashboard__info-item-bill">
              <div className="t-medium">Denomination: {bill.value}</div>
              <div className="flex t-small c-light">
                <span className="pad-8-r">ID:</span> <span>{bill.id}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default BillsList;
