import classNames from "classnames";

import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import ABLogo from "../../images/ab-logo-ico.svg?react";
import Send from "../../images/send-ico.svg?react";
import { IFungibleAsset } from "../../types/Types";
import { AlphaDecimals, AlphaType, TokenType, TransferFeeCreditView } from "../../utils/constants";
import { separateDigits, addDecimal } from "../../utils/utils";
import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import ReclaimFeeCredit from "./ReclaimFeeCredit";

export default function FeeCredit(): JSX.Element | null {
  const { setActiveAssetLocal } = useAuth();
  const { account, setIsActionsViewVisible, setActionsView, feeCreditBills, setPreviousView } = useApp();

  const alphaBalance = Number(
    account?.assets?.fungible?.find((asset: IFungibleAsset) => asset.typeId === AlphaType)?.amount,
  );

  return (
    <div
      className={classNames("assets-list", {
        "no-hover": true,
      })}
    >
      <>
        {feeCreditBills &&
          Object.entries(feeCreditBills).map(([key, value]: any, idx) => {
            const currentCreditBill = key === AlphaType ? feeCreditBills?.ALPHA : feeCreditBills?.UTP;
            const isMinReclaimAmount = Number(currentCreditBill?.value) > 2;

            return (
              <div
                key={idx}
                className={classNames({
                  "assets-list__item-hover-btn": value?.value > 0,
                  "no-pointer": !(alphaBalance > 0) || !isMinReclaimAmount,
                })}
              >
                <ReclaimFeeCredit isHidden={Boolean(Number(value?.value || 0) === 0)} isAlpha={key === AlphaType} />

                <div
                  className={classNames("assets-list__item", {
                    "no-hover": true,
                  })}
                >
                  <div className="assets-list__item-clicker"></div>
                  <div className={classNames("assets-list__item-icon")}>{<ABLogo />}</div>
                  <div className="assets-list__item-title">{key === AlphaType ? AlphaType : TokenType} credits</div>
                  <div className="assets-list__item-amount">
                    {separateDigits(addDecimal(value?.value || "0", AlphaDecimals))}{" "}
                  </div>
                </div>
              </div>
            );
          })}
        <Spacer mb={12} />
        <Button
          onClick={() => {
            setActionsView(TransferFeeCreditView);
            setIsActionsViewVisible(true);
            setPreviousView(null);
            setActiveAssetLocal(JSON.stringify(account?.assets?.fungible.find((asset) => asset.typeId === AlphaType)));
          }}
          disabled={!(alphaBalance > 0)}
          type="button"
          variant="primary"
        >
          {alphaBalance > 0 ? "Add fee credit" : "Insufficient funds to add fee credits"}
          <span className="pad-8-l ">
            <Send height="14" width="14" />
          </span>
        </Button>
      </>
    </div>
  );
}
