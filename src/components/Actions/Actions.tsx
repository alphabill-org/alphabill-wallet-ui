import classNames from "classnames";
import { useQueryClient } from "react-query";

import Button from "../Button/Button";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import { ReactComponent as Sync } from "../../images/sync-ico.svg";
import Send from "./components/Send";
import Account from "./components/AccountView";
import ImportAccount from "./components/ImportAccount";
import { useApp } from "../../hooks/appProvider";
import BillsList from "./components/BillsList/BillsList";

function Actions(): JSX.Element | null {
  const {
    isActionsViewVisible,
    setIsActionsViewVisible,
    actionsView,
    accounts,
    setSelectedSendKey,
    activeAccountId,
  } = useApp();
  const queryClient = useQueryClient();

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
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">{actionsView}</div>
        {actionsView === "Bills List" && (
          <Button
            onClick={() => {
              queryClient.invalidateQueries(["billsList", activeAccountId]);
              queryClient.invalidateQueries(["balance", activeAccountId]);
            }}
            className="btn__refresh"
            variant="icon"
          >
            <Sync />
          </Button>
        )}
      </div>
      <div className="actions__view">
        {actionsView === "Send" ? (
          <Send />
        ) : actionsView === "Bills List" ? (
          <BillsList />
        ) : actionsView === "Account" && accounts ? (
          <Account />
        ) : actionsView === "Import Account" && accounts ? (
          <ImportAccount />
        ) : (
          <></>
        )}
        <div className="actions__footer"></div>
      </div>
    </div>
  );
}

export default Actions;
