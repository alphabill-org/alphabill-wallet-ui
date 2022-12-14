import classNames from "classnames";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useQueryClient } from "react-query";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { IAccount, IAsset } from "../../types/Types";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { ReactComponent as ETHLogo } from "../../images/eth-ico.svg";
import { ReactComponent as CopyIco } from "../../images/copy-ico.svg";
import { ReactComponent as MoreIco } from "../../images/more-ico.svg";
import { ReactComponent as Sync } from "../../images/sync-ico.svg";
import Popups from "./Popups/Popups";
import { useApp } from "../../hooks/appProvider";
import Spinner from "../Spinner/Spinner";

function Dashboard(): JSX.Element | null {
  const {
    setIsActionsViewVisible,
    setActionsView,
    account,
    accounts,
    setAccounts,
    activeAccountId,
  } = useApp();
  const abBalance = account?.assets.find(
    (asset: IAsset) => (asset.id = "ALPHA")
  )?.amount;
  const [isAssetsColActive, setIsAssetsColActive] = useState(true);
  const [isRenamePopupVisible, setIsRenamePopupVisible] = useState(false);
  const [isAccountSettingsVisible, setIsAccountSettingsVisible] =
    useState(false);
  const queryClient = useQueryClient();
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

  if (!accounts) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Spacer mb={40} />
      <div className="dashboard__balance">
        <h1>{abBalance || 0}</h1>
        <h3>ALPHA</h3>
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
        </div>
      </div>
      <Spacer mb={8} />
      <div className="dashboard__buttons">
        <Button
          onClick={() => {
            queryClient.invalidateQueries(["billsList", activeAccountId]);
            queryClient.invalidateQueries(["balance", activeAccountId]);
          }}
          variant="primary"
        >
          <div className="pad-8-r">Refresh</div>
          <Sync height="16" width="16" />
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setActionsView("Send");
            setIsActionsViewVisible(true);
            queryClient.invalidateQueries(["billsList", activeAccountId]);
            queryClient.invalidateQueries(["balance", activeAccountId]);
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
              queryClient.invalidateQueries(["balance", account?.pubKey]);
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
                .map((asset: IAsset, idx: number) => {
                  // API supports only AB balance at the moment
                  return (
                    <div key={idx} className="dashboard__info-item-wrap">
                      <div className="dashboard__info-item-icon">
                        {asset?.id === "ALPHA" ? (
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
                          {asset.amount} {asset?.id}
                        </div>
                        <div className="t-small c-light">{asset.name}</div>
                      </div>
                      {asset?.id === "ALPHA" && (
                        <Button
                          variant="primary"
                          className="m-auto-l"
                          small
                          onClick={() => {
                            setActionsView("Bills List");
                            setIsActionsViewVisible(true);
                            queryClient.invalidateQueries([
                              "billsList",
                              activeAccountId,
                            ]);
                          }}
                        >
                          Show Bills
                        </Button>
                      )}
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
