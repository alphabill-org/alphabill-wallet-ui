import { useQueryClient } from "react-query";

import { IBill, ILockedBill } from "../../../../types/Types";
import Spacer from "../../../Spacer/Spacer";
import Button from "../../../Button/Button";
import { ReactComponent as MoreIco } from "../../../../images/more-ico.svg";
import { base64ToHexPrefixed } from "../../../../utils/utils";

export interface IBillsListItemProps {
  title: JSX.Element | null;
  filteredList: IBill[];
  setVisibleBillSettingID: (e: string | null) => void;
  visibleBillSettingID: string | null;
  setActiveBillId: (e: string) => void;
  setIsProofVisible: (e: boolean) => void;
  setIsLockFormVisible: (e: boolean) => void;
  setActionsView: (e: string) => void;
  setIsActionsViewVisible: (e: boolean) => void;
  setSelectedSendKey: (e: string) => void;
  isLockedBills?: boolean;
  lockedBills: ILockedBill[];
  setLockedBillsLocal: (e: string) => void;
}

function BillsListItem({
  filteredList,
  setVisibleBillSettingID,
  visibleBillSettingID,
  setActiveBillId,
  setIsProofVisible,
  setIsLockFormVisible,
  setActionsView,
  setIsActionsViewVisible,
  setSelectedSendKey,
  title,
  isLockedBills,
  setLockedBillsLocal,
  lockedBills,
}: IBillsListItemProps): JSX.Element | null {
  let denomination: number | null = null;
  const queryClient = useQueryClient();

  return (
    <>
      <Spacer mt={32} />
      {title}
      <Spacer mt={8} />

      {filteredList.map((bill: IBill, idx: number) => {
        const isNewDenomination = denomination !== bill.value;
        denomination = bill.value;

        return (
          <div key={bill.id}>
            {isNewDenomination && (
              <>
                {idx !== 0 && <Spacer mt={8} />}
                <div className="t-medium-small t-bold pad-24-h flex flex-align-c flex-justify-sb">
                  <div>Denomination: {bill.value}</div>
                </div>
              </>
            )}
            <div className={visibleBillSettingID === bill.id ? "" : "d-none"}>
              <Spacer mt={8} />
              <div className="flex flex-align-c pad-24-h">
                <Spacer mt={8} />
                <Button
                  onClick={() => {
                    setActiveBillId(bill.id);
                    setIsProofVisible(true);
                    queryClient.invalidateQueries([
                      "proof",
                      base64ToHexPrefixed(bill.id),
                    ]);
                  }}
                  xSmall
                  type="button"
                  variant="primary"
                >
                  Proof
                </Button>

                <span className="pad-8-l">
                  {!isLockedBills ? (
                    <Button
                      onClick={() => {
                        setIsLockFormVisible(true);
                        setActiveBillId(bill.id);
                      }}
                      xSmall
                      type="button"
                      variant="primary"
                    >
                      Lock
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setLockedBillsLocal(
                          JSON.stringify(
                            lockedBills.filter((key) => key.billId !== bill.id)
                          )
                        );
                        setActiveBillId(bill.id);
                      }}
                      xSmall
                      type="button"
                      variant="primary"
                    >
                      Unlock
                    </Button>
                  )}
                </span>
                <span className="pad-8-l">
                  <Button
                    onClick={() => {
                      setActionsView("Send");
                      setIsActionsViewVisible(true);
                      setSelectedSendKey(bill.id);
                    }}
                    xSmall
                    type="button"
                    variant="primary"
                  >
                    Send
                  </Button>
                </span>
              </div>
            </div>
            <div key={bill.id} className="dashboard__info-item-wrap small">
              <div className="dashboard__info-item-bill">
                <div className="flex t-small t-bold c-light">
                  <span className="pad-8-r">ID:</span>{" "}
                  <span>{base64ToHexPrefixed(bill.id)}</span>
                </div>
                {lockedBills?.find((key) => key.billId === bill.id) && (
                  <>
                    <div className="flex t-small t-bold c-light">
                      <span className="pad-8-r">Desc:</span>{" "}
                      <span>
                        {
                          lockedBills?.find((key) => key.billId === bill.id)
                            ?.desc
                        }
                      </span>
                    </div>
                  </>
                )}
              </div>
              <span className="pad-16-l">
                <Button
                  onClick={() =>
                    setVisibleBillSettingID(
                      visibleBillSettingID === bill.id ? null : bill.id
                    )
                  }
                  className="bills-list__settings"
                  variant="icon"
                >
                  <MoreIco
                    className="textfield__btn"
                    width="26"
                    height="12px"
                  />
                </Button>
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default BillsListItem;
