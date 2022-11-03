import classNames from "classnames";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import OutsideClickHandler from "react-outside-click-handler";
import { useQueryClient } from "react-query";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { IDashboardProps, IActivity, IAsset } from "../../types/Types";
import { ReactComponent as BuyIcon } from "../../images/buy-ico.svg";
import { ReactComponent as SendIcon } from "../../images/send-ico.svg";
import { ReactComponent as SwapIcon } from "../../images/swap-ico.svg";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { ReactComponent as ETHLogo } from "../../images/eth-ico.svg";
import { ReactComponent as CopyIco } from "../../images/copy-ico.svg";
import { ReactComponent as MoreIco } from "../../images/more-ico.svg";
import Popups from "./Popups/Popups";
import { useApp } from "../../hooks/appProvider";

function Dashboard({
  setActionsView,
  setIsActionsViewVisible,
  account,
  setAccounts,
  accounts,
}: IDashboardProps): JSX.Element | null {
  const { balance } = useApp();
  const [isAssetsColActive, setIsAssetsColActive] = useState(false);
  const [isBuyPopupVisible, setIsBuyPopupVisible] = useState(false);
  const [isRenamePopupVisible, setIsRenamePopupVisible] = useState(false);
  const [isAccountSettingsVisible, setIsAccountSettingsVisible] =
    useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    account && queryClient.invalidateQueries(["balance", account?.pubKey]);
  }, [account]);

  const activities = account?.activities;
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

  return (
    <div className="dashboard">
      <Spacer mb={40} />
      <div className="dashboard__balance">
        <h1>{balance?.balance || 0}</h1>
        <h3> {sortedAssets?.[0]?.id}</h3>
      </div>
      <Spacer mb={8} />

      <div className="dashboard__account">
        <div className="dashboard__account-id">
          {account?.name}{" "}
          <span>
            {account?.name && "-"} {account?.pubKey}
          </span>
        </div>
        <div className="dashboard__account-buttons">
          <CopyToClipboard text={account?.pubKey || ""}>
            <Button variant="icon">
              <CopyIco className="textfield__btn" height="12px" />
            </Button>
          </CopyToClipboard>
          <OutsideClickHandler
            display="flex"
            onOutsideClick={() => {
              setIsAccountSettingsVisible(false);
            }}
          >
            <Button
              onClick={() =>
                setIsAccountSettingsVisible(!isAccountSettingsVisible)
              }
              variant="icon"
            >
              <MoreIco className="textfield__btn" height="12px" />
              <div
                className={classNames("dashboard__account-options", {
                  active: isAccountSettingsVisible === true,
                })}
              >
                <div
                  onClick={() => setIsRenamePopupVisible(!isRenamePopupVisible)}
                  className="dashboard__account-option"
                >
                  Rename
                </div>
                <div
                  onClick={() => {
                    setActionsView("Account");
                    setIsActionsViewVisible(true);
                  }}
                  className="dashboard__account-option"
                >
                  Change Account
                </div>
              </div>
            </Button>
          </OutsideClickHandler>
        </div>
      </div>
      <Spacer mb={8} />
      <div className="dashboard__buttons">
        <Button
          variant="primary"
          onClick={() => {
            setIsBuyPopupVisible(true);
          }}
        >
          Request
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setActionsView("Send");
            setIsActionsViewVisible(true);
          }}
        >
          Send
        </Button>
      </div>
      <Spacer mb={32} />
      <div className="dashboard__footer">
        <div className="dashboard__navbar">
          <div
            onClick={() => setIsAssetsColActive(true)}
            className={classNames("dashboard__navbar-item", {
              active: isAssetsColActive === true,
            })}
          >
            Assets
          </div>
          <div
            onClick={() => setIsAssetsColActive(false)}
            className={classNames("dashboard__navbar-item", {
              active: isAssetsColActive !== true,
            })}
          >
            Activity
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
                .filter((asset) => asset.network === account?.activeNetwork)
                .map((asset: IAsset, idx) => {
                  return (
                    <div key={idx} className="dashboard__info-item-wrap">
                      <div className="dashboard__info-item-icon">
                        {asset?.id === "AB" ? (
                          <div className="icon-wrap ab-logo">
                            <ABLogo />
                          </div>
                        ) : asset?.id === "ETH" ? (
                          <div className="icon-wrap">
                            <ETHLogo />
                          </div>
                        ) : (
                          <></>
                        )}
                      </div>
                      <div>
                        <div>
                          {balance?.balance} {asset?.id}
                        </div>
                        <div className="t-small c-light">{asset.name}</div>
                      </div>
                    </div>
                  );
                })}
          </div>
          <div
            className={classNames("dashboard__info-col", {
              active: isAssetsColActive !== true,
            })}
          >
            {activities &&
              activities
                .sort((a: IActivity, b: IActivity) => {
                  return (
                    new Date(b.time).getTime() - new Date(a.time).getTime()
                  );
                })
                .map((activity: IActivity, idx) => {
                  if (account?.activeNetwork !== activity?.network) return null;

                  return (
                    <div key={idx} className="dashboard__info-item-wrap">
                      <div className="dashboard__info-item-icon">
                        {activity.type === "Buy" ? (
                          <div className="icon-wrap">
                            <BuyIcon />
                          </div>
                        ) : activity.type === "Send" ? (
                          <div className="icon-wrap">
                            <SendIcon />
                          </div>
                        ) : activity.type === "Receive" ? (
                          <div className="icon-wrap receive">
                            <SendIcon />
                          </div>
                        ) : (
                          <div className="icon-wrap">
                            <SwapIcon />
                          </div>
                        )}
                      </div>
                      <div className="dashboard__info-item-type">
                        <div className="t-medium">
                          {activity.type}{" "}
                          {activity.fromID && activity.fromID + " to "}
                          {activity.id}{" "}
                        </div>
                        <div className="t-small c-light">{activity.time}</div>
                        {activity.type !== "Swap" && activity.type !== "Buy" && (
                          <div className="t-small c-light t-ellipsis">
                            {activity.type === "Send" ? "To: " : "From: "}{" "}
                            {activity.fromAddress
                              ? activity.fromAddress
                              : activity.address}
                          </div>
                        )}
                      </div>
                      <div className="dashboard__info-item-amount">
                        <div className="t-medium">{activity.amount}</div>
                        <div className="t-small c-light">
                          {activity.fromAmount
                            ? activity.fromAmount
                            : activity.amount}
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
      <Popups
        accounts={accounts}
        account={account as any}
        setAccounts={setAccounts}
        isRenamePopupVisible={isRenamePopupVisible}
        setIsRenamePopupVisible={setIsRenamePopupVisible}
        isBuyPopupVisible={isBuyPopupVisible}
        setIsBuyPopupVisible={setIsBuyPopupVisible}
      />
    </div>
  );
}

export default Dashboard;
