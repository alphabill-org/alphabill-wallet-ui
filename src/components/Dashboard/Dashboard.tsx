import classNames from "classnames";
import { useState } from "react";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import {
  IDashboardProps,
  IActivity,
  IAsset,
  INetwork,
} from "../../types/Types";
import { ReactComponent as BuyIcon } from "../../images/buy-ico.svg";
import { ReactComponent as SendIcon } from "../../images/send-ico.svg";
import { ReactComponent as SwapIcon } from "../../images/swap-ico.svg";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { ReactComponent as ETHLogo } from "../../images/eth-ico.svg";
import Moonpay from "../../images/moonpay.svg";
import Popup from "../Popup/Popup";

function Dashboard({
  setActionsView,
  setIsActionsViewVisible,
  account,
}: IDashboardProps): JSX.Element | null {
  const [isAssetsColActive, setIsAssetsColActive] = useState(false);
  const [isBuyPopupVisible, setIsBuyPopupVisible] = useState(false);
  const activeNetwork = account?.networks?.find(
    (network: INetwork) => network.isActive === true
  );

  return (
    <div className="dashboard">
      <Spacer mb={40} />
      <div className="dashboard__balance">
        <h1>{account?.balance}</h1>
        <h3> AB</h3>
      </div>
      <Spacer mb={8} />
      <div className="dashboard__account">{account?.id}</div>
      <Spacer mb={8} />
      <div className="dashboard__buttons">
        <Button
          variant="primary"
          onClick={() => {
            setIsBuyPopupVisible(true);
          }}
        >
          Buy
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
        <Button
          variant="primary"
          onClick={() => {
            setActionsView("Swap");
            setIsActionsViewVisible(true);
          }}
        >
          Swap
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
            {account?.assets.map((asset: IAsset) => {
              return (
                <div key={asset.id} className="dashboard__info-item-wrap">
                  <div className="dashboard__info-item-icon">
                    {asset.id === "AB" ? (
                      <div className="icon-wrap ab-logo">
                        <ABLogo />
                      </div>
                    ) : asset.id === "ETH" ? (
                      <div className="icon-wrap">
                        <ETHLogo />
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                  <div>
                    <div>
                      {asset.amount} {asset.id}
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
            {account?.activities
              .sort((a: IActivity, b: IActivity) => {
                return new Date(a.time).getTime() - new Date(b.time).getTime();
              })
              .map((activity: IActivity, idx) => {
                if (activeNetwork?.id !== activity?.network) return null;

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
                      ) : (
                        <div className="icon-wrap">
                          <SwapIcon />
                        </div>
                      )}
                    </div>
                    <div className="dashboard__info-item-type">
                      <div className="t-medium">{activity.type}</div>
                      <div className="t-small c-light">{activity.time}</div>
                    </div>
                    <div className="dashboard__info-item-amount">
                      <div className="t-medium">{activity.amount}</div>
                      <div className="t-small c-light">{activity.amount}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      <Popup
        isPopupVisible={isBuyPopupVisible}
        setIsPopupVisible={setIsBuyPopupVisible}
        title=""
      >
        <div>
          <Spacer mb={8} />
          <img className="m-auto" height="32" src={Moonpay} alt="Profile" />
          <Spacer mb={16} />
          MoonPay supports popular payment methods, including Visa, Mastercard,
          Apple / Google / Samsung Pay, and bank transfers in 145+ countries.
          Tokens deposit into your MetaMask account.
          <Spacer mb={16} />
          <Button
            onClick={() => setIsBuyPopupVisible(false)}
            big={true}
            block={true}
            variant="primary"
          >
            Cancel
          </Button>
        </div>
      </Popup>
    </div>
  );
}

export default Dashboard;
