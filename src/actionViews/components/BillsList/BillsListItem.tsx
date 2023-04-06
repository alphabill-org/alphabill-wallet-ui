import { useQueryClient } from "react-query";

import { IActionVies, IActiveAsset, IBill } from "../../../types/Types";
import Spacer from "../../../components/Spacer/Spacer";
import Button from "../../../components/Button/Button";
import { ReactComponent as MoreIco } from "./../../../images/more-ico.svg";
import {
  base64ToHexPrefixed,
  addDecimal,
  separateDigits,
} from "../../../utils/utils";
import { AlphaDecimalPlaces, AlphaType } from "../../../utils/constants";
import { FungibleTokenKind } from "../../../utils/constants";
import { NonFungibleTokenKind } from "../../../utils/constants";

export interface IBillsListItemProps {
  title?: JSX.Element | null;
  filteredList: IBill[];
  setVisibleBillSettingID: (e: string | null) => void;
  visibleBillSettingID: string | null;
  setActiveBill: (e: IBill) => void;
  setIsProofVisible: (e: IBill) => void;
  setActionsView: (e: IActionVies) => void;
  setIsActionsViewVisible: (e: boolean) => void;
  setSelectedTransferKey: (e: string) => void;
  activeAsset: IActiveAsset;
}

function BillsListItem({
  filteredList,
  setVisibleBillSettingID,
  visibleBillSettingID,
  setActiveBill,
  setIsProofVisible,
  setActionsView,
  setIsActionsViewVisible,
  setSelectedTransferKey,
  title,
  activeAsset,
}: IBillsListItemProps): JSX.Element | null {
  let denomination: string | null = null;
  const queryClient = useQueryClient();

  return (
    <>
      <Spacer mt={32} />
      {title && (
        <>
          {title}
          <Spacer mt={8} />
        </>
      )}

      {filteredList?.map((bill: IBill, idx: number) => {
        const isNewDenomination = denomination !== bill.value;
        denomination = bill.value;

        return (
          <div key={bill.id}>
            {isNewDenomination && (
              <>
                {idx !== 0 && <Spacer mt={8} />}
                <div className="t-medium-small t-bold pad-24-h flex flex-align-c flex-justify-sb">
                  <div>
                    Denomination:{" "}
                    {separateDigits(
                      addDecimal(
                        bill.value,
                        activeAsset.typeId === AlphaType
                          ? AlphaDecimalPlaces
                          : bill.decimals || 0
                      )
                    )}
                  </div>
                </div>
              </>
            )}
            <div className={visibleBillSettingID === bill.id ? "" : "d-none"}>
              <Spacer mt={8} />
              <div className="flex flex-align-c pad-24-h pad-8-b">
                <Spacer mt={8} />
                {bill?.kind !== FungibleTokenKind &&
                  bill?.kind !== NonFungibleTokenKind && (
                    <Button
                      onClick={() => {
                        setActiveBill(bill);
                        setIsProofVisible(bill);
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
                  )}

                <span className="pad-8-l">
                  <Button
                    onClick={() => {
                      setActionsView("Transfer");
                      setIsActionsViewVisible(true);
                      setSelectedTransferKey(bill.id);
                    }}
                    xSmall
                    type="button"
                    variant="primary"
                  >
                    Transfer
                  </Button>
                </span>
              </div>
            </div>
            <div key={bill.id} className="dashboard__info-item-wrap small">
              <div className="dashboard__info-item-bill">
                <div className="flex t-small t-bold c-light pad-8-t">
                  <span className="pad-8-r">ID:</span>{" "}
                  <span className="t-ellipsis">
                    {base64ToHexPrefixed(bill.id)}
                  </span>
                </div>
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
                  <MoreIco width="12px" height="12px" />
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
