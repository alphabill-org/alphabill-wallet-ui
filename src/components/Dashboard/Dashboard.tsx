import classNames from "classnames";
import { useState } from "react";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { IAccountProps } from "../../types/Types";

function Dashboard(props: IAccountProps): JSX.Element | null {
  const [isAssetsColActive, setIsAssetsColActive] = useState(false);

  return (
    <div className="dashboard">
      <Spacer mb={40} />
      <div className="dashboard__balance">
        <h1>{props.account?.balance}</h1>
        <h3> AB</h3>
      </div>
      <Spacer mb={8} />
      <div className="dashboard__account">{props.account?.id}</div>
      <Spacer mb={8} />
      <div className="dashboard__buttons">
        <Button variant="primary">Buy</Button>
        <Button variant="primary">Send</Button>
        <Button variant="primary">Swap</Button>
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
            {props.account?.assets.map((asset) => {
              return (
                <div className="dashboard__info-col-item">
                  <div>{asset.id} AB</div>
                  {asset.amount}
                  <div></div>
                </div>
              );
            })}
          </div>
          <div
            className={classNames("dashboard__info-col", {
              active: isAssetsColActive !== true,
            })}
          >
            {props.account?.activities.map((activity) => {
              return (
                <div className="dashboard__info-col-item">
                  <div>{activity.id} AB</div>
                  {activity.amount}
                  <div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
