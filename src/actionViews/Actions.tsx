import classNames from "classnames";

import Button from "../components/Button/Button";
import { ReactComponent as Arrow } from "./../images/arrow.svg";
import { useApp } from "../hooks/appProvider";
import Send from "./components/Send";
import BillsList from "./components/BillsList/BillsList";
import AccountView from "./components/AccountView";

function Actions(): JSX.Element | null {
  const {
    isActionsViewVisible,
    setIsActionsViewVisible,
    actionsView,
    accounts,
    setSelectedSendKey,
  } = useApp();

  return (
    <div
      className={classNames("actions", { "is-visible": isActionsViewVisible })}
    >
      <div className="actions__header">
        <Button
          onClick={() => {
            setIsActionsViewVisible(!isActionsViewVisible);
            actionsView === "Send" && setSelectedSendKey(null);
          }}
          className="btn__back"
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">{actionsView}</div>
      </div>
      <div className="actions__view">
        {actionsView === "Send" ? (
          <Send />
        ) : actionsView === "Bills List" ? (
          <BillsList />
        ) : actionsView === "Profile" && accounts ? (
          <AccountView />
        ) : (
          <></>
        )}
        <div className="actions__footer"></div>
      </div>
    </div>
  );
}

export default Actions;
