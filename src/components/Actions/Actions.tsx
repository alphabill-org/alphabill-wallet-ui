import classNames from "classnames";

import Button from "../Button/Button";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import Send from "./components/Send";
import Account from "./components/AccountView";
import ImportAccount from "./components/ImportAccount";
import { useApp } from "../../hooks/appProvider";

function Actions(): JSX.Element | null {
  const {
    isActionsViewVisible,
    setIsActionsViewVisible,
    actionsView,
    accounts,
    setAccounts,
  } = useApp();

  return (
    <div
      className={classNames("actions", { "is-visible": isActionsViewVisible })}
    >
      <div className="actions__header">
        <Button
          onClick={() => setIsActionsViewVisible(!isActionsViewVisible)}
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">{actionsView}</div>
      </div>
      <div className="actions__view">
        {actionsView === "Send" ? (
          <Send />
        ) : actionsView === "Account" && accounts ? (
          <Account />
        ) : actionsView === "Import Account" && accounts ? (
          <ImportAccount accounts={accounts} setAccounts={setAccounts!} />
        ) : (
          <></>
        )}
        <div className="actions__footer"></div>
      </div>
    </div>
  );
}

export default Actions;
