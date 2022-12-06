import { useQueryClient } from "react-query";

import { IBill, ILockedBill } from "../../../../types/Types";
import { useApp } from "../../../../hooks/appProvider";
import { useAuth } from "../../../../hooks/useAuth";
import Spacer from "../../../Spacer/Spacer";
import Button from "../../../Button/Button";
import { ReactComponent as MoreIco } from "../../../../images/more-ico.svg";
import { base64ToHexPrefixed } from "../../../../utils/utils";

export interface IBillsListItemProps {
  title: JSX.Element | null;
  filteredList: IBill[];
  DCBills: IBill[];
  setVisibleBillSettingID: (e: string | null) => void;
  visibleBillSettingID: string | null;
  setCollectableBills: (e: IBill[]) => void;
  collectableBills: IBill[];
  setActiveBillId: (e: string) => void;
  setIsProofVisible: (e: boolean) => void;
  setIsLockFormVisible: (e: boolean) => void;
  setActionsView: (e: string) => void;
  setIsActionsViewVisible: (e: boolean) => void;
  setSelectedSendKey: (e: string) => void;
  isSelectedForCollection?: boolean;
  isLockedBills?: boolean;
  lockedKeys: ILockedBill[];
  setLockedKeys: (e: ILockedBill[]) => void;
}

function BillsListItem({
  filteredList,
  DCBills,
  setVisibleBillSettingID,
  visibleBillSettingID,
  setCollectableBills,
  collectableBills,
  setActiveBillId,
  setIsProofVisible,
  setIsLockFormVisible,
  setActionsView,
  setIsActionsViewVisible,
  setSelectedSendKey,
  isSelectedForCollection,
  title,
  isLockedBills,
  setLockedKeys,
  lockedKeys,
}: IBillsListItemProps): JSX.Element | null {
  let denomination: number | null = null;
  const queryClient = useQueryClient();

  return (
    <>
      <Spacer mt={32} />
      {title}
      <Spacer mt={12} />

      {filteredList.map((bill: IBill, idx: number) => {
        const isNewDenomination = denomination !== bill.value;
        const amountOfGivenDenomination = filteredList?.filter(
          (b: IBill) => b.value === bill.value
        ).length;
        denomination = bill.value;

        return (
          <div key={bill.id}>
            {isNewDenomination && (
              <>
                {idx !== 0 && <Spacer mt={16} />}
                <div className="t-medium-small t-bold pad-24-h flex flex-align-c">
                  Denomination: {bill.value}{" "}
                  <span className="t-medium pad-8-l">
                    (total of {amountOfGivenDenomination} bill{""}
                    {amountOfGivenDenomination > 1 && "s"})
                  </span>
                </div>
                {!isSelectedForCollection &&
                  !isLockedBills &&
                  DCBills.length < 1 &&
                  amountOfGivenDenomination > 1 && (
                    <>
                      <Spacer mt={8} />

                      <span className="pad-24-h flex">
                        <Button
                          onClick={() => {
                            setCollectableBills(
                              collectableBills.concat(
                                filteredList.filter(
                                  (b: IBill) => b.value === bill.value
                                )
                              )
                            );
                          }}
                          small
                          type="button"
                          variant="secondary"
                          className="w-100p"
                        >
                          Select All {bill.value} AB Bills For DC
                        </Button>
                      </span>

                      <Spacer mt={4} />
                    </>
                  )}
              </>
            )}
            <div className={visibleBillSettingID === bill.id ? "" : "d-none"}>
              <Spacer mt={12} />
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
                {!isLockedBills && (
                  <span className="pad-8-l">
                    <Button
                      onClick={() => {
                        setCollectableBills([
                          ...collectableBills,
                          {
                            id: bill.id,
                            value: bill.value,
                            txHash: bill.txHash,
                          },
                        ]);
                      }}
                      xSmall
                      type="button"
                      variant="primary"
                      disabled={DCBills.length > 0}
                    >
                      Select For Collection
                    </Button>
                  </span>
                )}
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
                        setLockedKeys(
                          lockedKeys.filter((key) => key.billId !== bill.id)
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
                {lockedKeys.find((key) => key.billId === bill.id) && (
                  <>
                    <div className="flex t-small t-bold c-light">
                      <span className="pad-8-r">Desc:</span>{" "}
                      <span>
                        {
                          lockedKeys?.find((key) => key.billId === bill.id)
                            ?.desc
                        }
                      </span>
                    </div>
                    <div className="flex t-small t-bold c-light">
                      <span className="pad-8-r">Value:</span>{" "}
                      <span>
                        {
                          lockedKeys?.find((key) => key.billId === bill.id)
                            ?.value
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
