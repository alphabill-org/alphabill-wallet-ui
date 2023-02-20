import classNames from "classnames";
import { useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useQueryClient } from "react-query";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { IAccount, IAsset, IFungibleAsset } from "../../types/Types";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { ReactComponent as CopyIco } from "../../images/copy-ico.svg";
import { ReactComponent as MoreIco } from "../../images/more-ico.svg";
import { ReactComponent as Sync } from "../../images/sync-ico.svg";
import Popups from "./Popups/Popups";
import { useApp } from "../../hooks/appProvider";
import Spinner from "../Spinner/Spinner";
import { useAuth } from "../../hooks/useAuth";

import { invalidateAllLists, useDocumentClick } from "../../utils/utils";

function Dashboard(): JSX.Element | null {
  const { activeAccountId, activeAsset, setActiveAssetLocal } = useAuth();
  const {
    setIsActionsViewVisible,
    setActionsView,
    account,
    accounts,
    setAccounts,
  } = useApp();
  const balance: string =
    account?.assets?.find(
      (asset: IAsset) => asset.typeId === activeAsset.typeId
    )?.UIAmount || "";

  const balanceSizeClass =
    balance?.length > 7 ? (balance?.length > 12 ? "x-small" : "small") : "";

  const [isAssetsColActive, setIsAssetsColActive] = useState(true);
  const [isRenamePopupVisible, setIsRenamePopupVisible] = useState(false);
  const [isAccountSettingsVisible, setIsAccountSettingsVisible] =
    useState(false);
  const queryClient = useQueryClient();
  const popupRef = useRef<HTMLDivElement>(null);
  const sortedAssets = account?.assets
    ?.sort((a: IAsset, b: IAsset) => {
      if (a?.id! < b?.id!) {
        return -1;
      }
      if (a?.id! > b?.id!) {
        return 1;
      }
      return 0;
    })
    .filter((asset) => asset.network === account?.activeNetwork);

  useDocumentClick(() => {
    isAccountSettingsVisible === true && setIsAccountSettingsVisible(false);
  }, popupRef);

  if (!accounts) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Spacer mb={48} />
      <div className="dashboard__balance">
        <div
          className={classNames("dashboard__balance-amount", balanceSizeClass)}
        >
          {balance || "0"}
        </div>
        <div
          className={classNames(
            "dashboard__balance-id t-ellipsis",
            balanceSizeClass
          )}
        >
          {activeAsset.name}
        </div>
      </div>
      <Spacer mb={32} />

      <div className="dashboard__account">
        <div className="dashboard__account-id">
          <span className="dashboard__account-name">{account?.name}</span>
          <span className="dashboard__account-id-item">
            {account?.name && "-"} {account?.pubKey}
          </span>
        </div>
        <div className="dashboard__account-buttons">
          <CopyToClipboard text={account?.pubKey || ""}>
            <Button
              id="copy-tooltip"
              tooltipContent="Key copied"
              variant="icon"
              className="copy-btn"
            >
              <CopyIco className="textfield__btn" height="12px" />
            </Button>
          </CopyToClipboard>
          <div className="p-rel" ref={popupRef}>
            <Button
              onClick={() =>
                setIsAccountSettingsVisible(!isAccountSettingsVisible)
              }
              variant="icon"
            >
              <MoreIco className="textfield__btn" height="12px" />
            </Button>
            <div
              className={classNames("dashboard__account-options", {
                active: isAccountSettingsVisible === true,
              })}
            >
              <div
                onClick={() => {
                  setIsRenamePopupVisible(!isRenamePopupVisible);
                  setIsAccountSettingsVisible(false);
                }}
                className="dashboard__account-option"
              >
                Rename
              </div>
              <div
                onClick={() => {
                  setActionsView("Profile");
                  setIsActionsViewVisible(true);
                  setIsAccountSettingsVisible(false);
                }}
                className="dashboard__account-option"
              >
                Change public key
              </div>
            </div>
          </div>
        </div>
      </div>
      <Spacer mb={8} />
      <div className="dashboard__buttons">
        <Button
          onClick={() =>
            invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient)
          }
          variant="primary"
        >
          <div className="pad-8-r">Refresh</div>
          <Sync height="16" width="16" />
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setActionsView("Send");
            setActiveAssetLocal(
              JSON.stringify({ name: "ALPHA", typeId: "ALPHA" })
            );
            setIsActionsViewVisible(true);
            invalidateAllLists(
              activeAccountId,
              activeAsset.typeId,
              queryClient
            );
          }}
        >
          Send bills
        </Button>
      </div>
      <Spacer mb={32} />
      <div className="dashboard__footer">
        <div className="dashboard__navbar">
          <div
            onClick={() => {
              setIsAssetsColActive(true);
              invalidateAllLists(
                activeAccountId,
                activeAsset.typeId,
                queryClient
              );
            }}
            className={classNames("dashboard__navbar-item", {
              active: isAssetsColActive === true,
            })}
          >
            Assets
          </div>
        </div>
        <div className="dashboard__info">
          <div
            className={classNames("dashboard__info-col", {
              active: isAssetsColActive === true,
            })}
          >
            {sortedAssets &&
              sortedAssets
                .filter(
                  (asset: IAsset) => asset.network === account?.activeNetwork
                )
                .sort((a: IAsset, b: IAsset) => {
                  if (a?.name! < b?.name!) {
                    return -1;
                  }
                  if (a?.name! > b?.name!) {
                    return 1;
                  }
                  return 0;
                })
                .sort(function (a, b) {
                  if (a.id === "ALPHA") {
                    return -1; // Move the object with the given ID to the beginning of the array
                  }
                  return 1;
                })
                .map((asset: IAsset | IFungibleAsset, idx: number) => {
                  return (
                    <div
                      key={idx}
                      className="dashboard__info-item-wrap"
                      onClick={() => {
                        setActiveAssetLocal(
                          JSON.stringify({
                            name: asset.name,
                            typeId: asset.typeId,
                            decimalFactor: asset.decimalFactor,
                            decimalPlaces: asset.decimalPlaces,
                          })
                        );
                        invalidateAllLists(
                          activeAccountId,
                          activeAsset.typeId,
                          queryClient
                        );
                      }}
                    >
                      <div className="dashboard__info-item-icon">
                        {asset?.id === "ALPHA" ? (
                          <div className="icon-wrap ab-logo">
                            <ABLogo />
                          </div>
                        ) : (
                          <div className="utp-icon">
                            {(asset as IFungibleAsset)?.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="dashboard__info-item-desc">
                        <span className="t-ellipsis pad-8-r">
                          {asset.UIAmount || 0}
                        </span>
                        <span className="t-ellipsis">{asset?.name}</span>
                      </div>

                      <Button
                        variant="primary"
                        className="m-auto-l"
                        small
                        onClick={() => {
                          setActionsView("Bills List");
                          setIsActionsViewVisible(true);
                          invalidateAllLists(
                            activeAccountId,
                            activeAsset.typeId,
                            queryClient
                          );
                        }}
                      >
                        Show Bills
                      </Button>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
      <Popups
        accounts={accounts}
        account={account as IAccount}
        setAccounts={setAccounts}
        isRenamePopupVisible={isRenamePopupVisible}
        setIsRenamePopupVisible={setIsRenamePopupVisible}
      />
    </div>
  );
}

export default Dashboard;
