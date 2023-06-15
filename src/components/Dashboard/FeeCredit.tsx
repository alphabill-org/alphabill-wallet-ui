import classNames from "classnames";
import { useEffect, useState } from "react";

import { AlphaType, TransferFeeCreditView } from "../../utils/constants";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { useAuth } from "../../hooks/useAuth";
import Button from "../Button/Button";
import { useApp } from "../../hooks/appProvider";
import { IFeeCreditBills, IFungibleAsset } from "../../types/Types";
import Spacer from "../Spacer/Spacer";
import { publicKeyHash } from "../../utils/hashers";
import { getFeeCreditBills } from "../../hooks/requests";

export default function FeeCredit(): JSX.Element | null {
  const { activeAsset, activeAccountId } = useAuth();
  const {
    account,
    setIsActionsViewVisible,
    setActionsView,
    setSelectedTransferKey,
    setPreviousView,
  } = useApp();

  const [feeCreditData, setFeeCreditData] = useState<IFeeCreditBills | null>();

  useEffect(() => {
    const fetchData = async () => {
      const publicKey = await publicKeyHash(
        Buffer.from(activeAccountId, "hex"),
        true
      );
      const result = await getFeeCreditBills(publicKey as string);
      setFeeCreditData(result);
    };

    fetchData();
  }, [activeAccountId]);

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
      {alphaBalance > 0  ? (
        <>
          {feeCreditData && Object.entries(feeCreditData).map(([key, value]: any) => {
            return (
              <div
                key={value.id}
                className={classNames("assets-list__item", {
                  "no-hover": true,
                })}
              >
                <div className="assets-list__item-clicker"></div>
                <div className={classNames("assets-list__item-icon")}>
                  {key === AlphaType ? <ABLogo /> : "UT"}
                </div>
                <div className="assets-list__item-title">{value.name}</div>
                {value.balance && (
                  <div className="assets-list__item-amount">{value.amount}</div>
                )}
              </div>
            );
          })}{" "}
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
      <Spacer mt={8} />
    </div>
  );
}
