import classNames from "classnames";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { IActionProps } from "../../types/Types";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import Send from "./components/Send";

function Actions({
  actionsView,
  setIsActionsViewVisible,
  isActionsViewVisible,
  account,
  accounts,
  setAccounts,
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
      <Spacer mb={8} />
      <div className="actions__view">
        {actionsView === "Send" ? (
          <Send
            account={account}
            accounts={accounts}
            setAccounts={setAccounts}
          />
        ) : (
          <></>
        )}
        <div className="actions__footer"></div>
      </div>
    </div>
  );
}

export default Actions;
