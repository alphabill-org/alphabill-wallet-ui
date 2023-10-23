import classNames from "classnames";

import {
  AlphaDecimals,
  AlphaType,
  TokenType,
  TransferFeeCreditView,
} from "../../utils/constants";
import { ReactComponent as CreditIco } from "../../images/credit-ico.svg";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { useAuth } from "../../hooks/useAuth";
import Button from "../Button/Button";
import { useApp } from "../../hooks/appProvider";
import { IAssetsColProps, IFungibleAsset } from "../../types/Types";
import Spacer from "../Spacer/Spacer";
import { separateDigits, addDecimal } from "../../utils/utils";
import ReclaimFeeCredit from "./ReclaimFeeCredit";

export default function FeeCredit({
  isTitle,
}: IAssetsColProps): JSX.Element | null {
  const { setActiveAssetLocal } = useAuth();
  const {
    account,
    setIsActionsViewVisible,
    setActionsView,
    feeCreditBills,
    setPreviousView,
  } = useApp();

  const alphaBalance = Number(
    account?.assets?.fungible?.find(
      (asset: IFungibleAsset) => asset.typeId === AlphaType
    )?.amount
  );

  return (
    <>
      {isTitle && (
        <div className="pad-16-h flex">
          <span>Fee credits</span>
          <Button
            onClick={() => {
              setActionsView(TransferFeeCreditView);
              setIsActionsViewVisible(true);
              setPreviousView(null);
              setActiveAssetLocal(
                JSON.stringify(
                  account?.assets?.fungible.find(
                    (asset) => asset.typeId === AlphaType
                  )
                )
              );
            }}
            disabled={!Boolean(alphaBalance > 0)}
            type="button"
            variant="icon"
            className="fee-credit-button"
          >
            <CreditIco height="24" width="24" />
            <span className="pad-8-l">Add fee credit</span>
          </Button>
        </div>
      )}
      <div
        className={classNames("assets-list assets-list__items-big", {
          "no-hover": true,
        })}
      >
        <>
          {feeCreditBills &&
            Object.entries(feeCreditBills).map(([key, value]: any, idx) => {
              const currentCreditBill =
                key === AlphaType ? feeCreditBills?.ALPHA : feeCreditBills?.UTP;

              return (
                <div
                  key={idx}
                >
                  <div
                    className={classNames(
                      "assets-list__item assets-list__item-credit",
                      {
                        "no-hover": true,
                      }
                    )}
                  >
                    <div className={classNames("assets-list__item-icon")}>
                      {<ABLogo />}
                    </div>
                    <div className="assets-list__item-title">
                      {key === AlphaType ? AlphaType : TokenType} credits
                    </div>
                    <div>
                      {separateDigits(
                        addDecimal(value?.value || "0", AlphaDecimals)
                      )}{" "}
                    </div>
                    <ReclaimFeeCredit
                      isHidden={Boolean(Number(value?.value || 0) === 0)}
                      isAlpha={key === AlphaType}
                    />
                  </div>
                </div>
              );
            })}
        </>
      </div>
    </>
  );
}
