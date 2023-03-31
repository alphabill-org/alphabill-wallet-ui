import classNames from "classnames";
import { useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useQueryClient } from "react-query";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { IAccount, IFungibleAsset } from "../../types/Types";
import { ReactComponent as CopyIco } from "../../images/copy-ico.svg";
import { ReactComponent as MoreIco } from "../../images/more-ico.svg";
import { ReactComponent as Sync } from "../../images/sync-ico.svg";
import Popups from "./components/Popups";
import { useApp } from "../../hooks/appProvider";
import Spinner from "../Spinner/Spinner";
import { useAuth } from "../../hooks/useAuth";

import { invalidateAllLists, useDocumentClick } from "../../utils/utils";
import { AlphaType } from "../../utils/constants";
import FungibleAssetsCol from "./components/FungibleAssetsCol";
import NFTAssetsCol from "./components/NFTAssetsCol";

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
    account?.assets?.fungible?.find(
      (asset: IFungibleAsset) => asset.typeId === AlphaType
    )?.UIAmount || "";

  const balanceSizeClass =
    Number(balance?.length) > 7
      ? balance?.length > 12
        ? "x-small"
        : "small"
      : "";

  const [activeAssetKind, setActiveAssetKind] = useState<"fungible" | "nft">(
    "fungible"
  );
  const [isRenamePopupVisible, setIsRenamePopupVisible] = useState(false);
  const [isAccountSettingsVisible, setIsAccountSettingsVisible] =
    useState(false);
  const queryClient = useQueryClient();
  const popupRef = useRef<HTMLDivElement>(null);

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
          {AlphaType}
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
            setActionsView("Transfer");
            setActiveAssetLocal(
              JSON.stringify({ name: AlphaType, typeId: AlphaType })
            );
            setIsActionsViewVisible(true);
            invalidateAllLists(
              activeAccountId,
              activeAsset.typeId,
              queryClient
            );
          }}
        >
          Transfer
        </Button>
      </div>
      <Spacer mb={32} />
      <div className="dashboard__footer">
        <div className="dashboard__navbar">
          <div
            onClick={() => {
              setActiveAssetKind("fungible");
              invalidateAllLists(
                activeAccountId,
                activeAsset.typeId,
                queryClient
              );
            }}
            className={classNames("dashboard__navbar-item", {
              active: activeAssetKind === "fungible",
            })}
          >
            Fungible
          </div>

          <div
            onClick={() => {
              setActiveAssetKind("nft");
              invalidateAllLists(
                activeAccountId,
                activeAsset.typeId,
                queryClient
              );
            }}
            className={classNames("dashboard__navbar-item", {
              active: activeAssetKind === "nft",
            })}
          >
            Non Fungible
          </div>
        </div>
        <div className="dashboard__info">
          {activeAssetKind === "nft" ? <NFTAssetsCol /> : <FungibleAssetsCol />}
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
