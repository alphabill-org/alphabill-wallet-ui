import classNames from "classnames";

import Button from "../components/Button/Button";
import Arrow from "./../images/arrow.svg?react";
import AccountView from "./components/AccountView";
import { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

function Profile(): ReactElement {
  const navigate = useNavigate();

  return (
    <div
      className={classNames("actions", { "is-visible": true })}
    >
      <div className="actions__header">
        <Button
          onClick={() => {
            navigate(-1);
          }}
          className="btn__back"
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">
          Profile
        </div>
      </div>
      <div className="actions__view">
        <AccountView />
        <div className="actions__footer"></div>
      </div>
    </div>
  );
}

export default Profile;
