import classNames from "classnames";

import Button from "../Button/Button";
import { IActionProps } from "../../types/Types";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import Send from "./components/Send";
import Account from "./components/AccountView";
import ImportAccount from "./components/ImportAccount";
import Swap from "./components/Swap";

function Actions({
  actionsView,
  setIsActionsViewVisible,
  setActionsView,
  isActionsViewVisible,
  account,
  accounts,
  setAccounts,
  setIsLoggedIn
}: IActionProps): JSX.Element | null {
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
          <Send
            account={account}
            accounts={accounts}
            setAccounts={setAccounts}
            setIsActionsViewVisible={setIsActionsViewVisible}
          />
        ) : actionsView === "Swap" ? (
          <Swap
            account={account}
            accounts={accounts}
            setAccounts={setAccounts}
            setIsActionsViewVisible={setIsActionsViewVisible}
          />
        ) : actionsView === "Account" && accounts ? (
          <Account
            accounts={accounts}
            setAccounts={setAccounts}
            setActionsView={setActionsView}
            setIsActionsViewVisible={setIsActionsViewVisible}
            setIsLoggedIn={setIsLoggedIn}
          />
        ) : actionsView === "Import Account" && accounts ? (
          <ImportAccount accounts={accounts} setAccounts={setAccounts} />
        ) : (
          <></>
        )}
        <div className="actions__footer"></div>
      </div>
    </div>
  );
}

export default Actions;
