import { useState } from "react";
import classNames from "classnames";

import Button from "../components/Button/Button";
import { ReactComponent as Arrow } from "./../images/arrow.svg";
import { useApp } from "../hooks/appProvider";
import Send from "./components/Send";
import BillsList from "./components/BillsList/BillsList";
import AccountView from "./components/AccountView";
import { useAuth } from "../hooks/useAuth";
import TransferNFTs from "./components/TransferNFTs";
import Navbar from "../components/Navbar/Navbar";
import Spacer from "../components/Spacer/Spacer";

function Actions(): JSX.Element | null {
  const {
    isActionsViewVisible,
    setIsActionsViewVisible,
    actionsView,
    accounts,
    setSelectedSendKey,
  } = useApp();
  const { activeAsset } = useAuth();
  const [isFungibleTransfer, setIsFungibleTransfer] = useState<boolean>(true);

  return (
    <div
      className={classNames("actions", { "is-visible": isActionsViewVisible })}
    >
      <div className="actions__header">
        <Button
          onClick={() => {
            setIsActionsViewVisible(!isActionsViewVisible);
            actionsView === "Transfer" && setSelectedSendKey(null);
          }}
          className="btn__back"
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">
          {actionsView === "Fungible list view"
            ? activeAsset.name
            : actionsView}
        </div>
      </div>
      <div className="actions__view">
        {actionsView === "Transfer" && (
          <>
            <Spacer mt={8} />
            <Navbar onChange={(v: boolean) => setIsFungibleTransfer(v)} />
          </>
        )}
        {actionsView === "Transfer" ? (
          isFungibleTransfer ? (
            <Send />
          ) : (
            <TransferNFTs />
          )
        ) : actionsView === "Fungible list view" ? (
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
