import classNames from "classnames";
import { useEffect, useState } from "react";

import {
  AlphaDecimals,
  AlphaType,
  TransferFeeCreditView,
} from "../../utils/constants";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { useAuth } from "../../hooks/useAuth";
import Button from "../Button/Button";
import { useApp } from "../../hooks/appProvider";
import { IFungibleAsset } from "../../types/Types";
import Spacer from "../Spacer/Spacer";
import { separateDigits, addDecimal } from "../../utils/utils";

export default function FeeCredit(): JSX.Element | null {
  const { activeAsset, activeAccountId } = useAuth();
  const {
    account,
    setIsActionsViewVisible,
    setActionsView,
    setSelectedTransferKey,
    setPreviousView,
    feeCreditBills,
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
      {alphaBalance > 0 ? (
        <>
          {feeCreditBills &&
            Object.entries(feeCreditBills).map(([key, value]: any, idx) => {
              return (
                <div
                  key={idx}
                  className={classNames("assets-list__item", {
                    "no-hover": true,
                  })}
                >
                  <div className="assets-list__item-clicker"></div>
                  <div className={classNames("assets-list__item-icon")}>
                    {<ABLogo />}
                  </div>
                  <div className="assets-list__item-title">
                    {key === "alpha" ? "ALPHA" : "Tokens"} credits
                  </div>
                  <div className="assets-list__item-amount">
                    {separateDigits(
                      addDecimal(value?.value || "0", AlphaDecimals)
                    )}{" "}
                  </div>
                </div>
              );
            })}
          <Spacer mb={12    } />
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
        </>
      ) : (
        "Insufficient ALPHA funds to add fee credits"
      )}
    </div>
  );
}
