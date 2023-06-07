import classNames from "classnames";
import { useQueryClient } from "react-query";

import {
  AlphaType,
  FungibleTokenKind,
  TransferFeeCreditView,
  TransferFungibleView,
  TransferNFTView,
} from "../../utils/constants";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { useAuth } from "../../hooks/useAuth";
import { base64ToHexPrefixed, invalidateAllLists } from "../../utils/utils";
import Button from "../Button/Button";
import { useApp } from "../../hooks/appProvider";
import { IActiveAsset, IBill, IFungibleAsset } from "../../types/Types";
import Spacer from "../Spacer/Spacer";

export interface IFeeCreditProps {
  isTypeListItem?: boolean;
  onItemClick?: () => void;
  onSendClick?: (e: IActiveAsset) => void;
  setIsProofVisible?: (e: IBill) => void;
  isProofButton?: boolean;
  isTransferButton?: boolean;
  isHoverDisabled?: boolean;
}

export default function FeeCredit({
  isTypeListItem,
  onItemClick,
}: IFeeCreditProps): JSX.Element | null {
  const { activeAsset } = useAuth();
  const queryClient = useQueryClient();
  const {
    account,
    setIsActionsViewVisible,
    setActionsView,
    setSelectedTransferKey,
    setPreviousView,
  } = useApp();

  const alphaBalance = Number(
    account?.assets?.fungible?.find(
      (asset: IFungibleAsset) => asset.typeId === AlphaType
    )?.amount
  );

  const feeCredits = [
    { name: "ALPHA", balance: 100 },
    { name: "User Tokens", balance: 100 },
  ];

  return (
    <div
      className={classNames("assets-list", {
        "no-hover": true,
      })}
    >
      {alphaBalance > 0
        ? feeCredits?.map((asset: any) => {
            return (
              <div
                key={asset.id}
                className={classNames("assets-list__item", {
                  "no-hover": true,
                })}
              >
                <div className="assets-list__item-clicker"></div>
                <div className={classNames("assets-list__item-icon")}>
                  {asset?.name === AlphaType ? <ABLogo /> : "UT"}
                </div>
                <div className="assets-list__item-title">{asset.name}</div>
                {asset.balance && (
                  <div className="assets-list__item-amount">
                    {asset.balance}
                  </div>
                )}
              </div>
            );
          })
        : "Need ALPHA"}
      <Spacer mt={8} />
      <Button
        onClick={() => {
          setActionsView(TransferFeeCreditView);
          setIsActionsViewVisible(true);
          activeAsset && setSelectedTransferKey(activeAsset.id!);
          setPreviousView(TransferFeeCreditView);
        }}
        type="button"
        variant="primary"
      >
        Add fee credit{" "}
        <span className="pad-8-l ">
          <Send height="14" width="14" />
        </span>
      </Button>
    </div>
  );
}
