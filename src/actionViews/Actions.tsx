import classNames from "classnames";

import Button from "../components/Button/Button";
import { ReactComponent as Arrow } from "./../images/arrow-ico.svg";
import { ReactComponent as Close } from "./../images/close.svg";

import { useApp } from "../hooks/appProvider";
import TransferFungible from "./components/TransferFungible";
import TransferFeeCredit from "./components/TransferFeeCredit";
import BillsList from "./components/BillsList/BillsList";
import AccountView from "./components/AccountView";
import { useAuth } from "../hooks/useAuth";
import TransferNFTs from "./components/TransferNFTs";
import Spacer from "../components/Spacer/Spacer";
import AssetsList from "../components/AssetsList/AssetsList";
import {
  FungibleListView,
  NFTDetailsView,
  NFTListView,
  ProfileView,
  TransferFeeCreditView,
  TransferFungibleView,
  TransferNFTView,
} from "../utils/constants";
import NFTDetails from "./components/NFTDetails";
import { IActionVies } from "../types/Types";
import { removeConnectTransferData } from "../utils/utils";

function Actions(): JSX.Element | null {
  const {
    isActionsViewVisible,
    setIsActionsViewVisible,
    actionsView,
    accounts,
    setSelectedTransferKey,
    NFTList,
    setActionsView,
    setPreviousView,
    previousView,
  } = useApp();
  const { activeAsset } = useAuth();
  const isTransferView =
    actionsView === TransferFungibleView ||
    actionsView === TransferNFTView ||
    actionsView === TransferFeeCreditView;

  return (
    <div
      className={classNames("actions", {
        "is-visible": isActionsViewVisible,
        "actions--transfer": isTransferView,
      })}
    >
      <div className="actions__header">
        <Button
          onClick={() => {
            if (actionsView === NFTDetailsView) {
              setActionsView(NFTListView);
            } else if (previousView) {
              setActionsView(previousView as IActionVies);
            } else {
              setIsActionsViewVisible(false);
            }

            if (isTransferView) {
              setPreviousView(null);
              setSelectedTransferKey(null);
            }

            removeConnectTransferData();
          }}
          className="btn__back"
          variant="icon"
        >
          {isTransferView ? (
            <Close height="16" width="16" />
          ) : (
            <Arrow height="24" width="24" />
          )}
        </Button>
        <div className="actions__title">
          {actionsView === NFTListView || actionsView === FungibleListView
            ? activeAsset?.symbol
            : actionsView.replace("view", "")}
        </div>
      </div>
      <div className="actions__view">
        {actionsView === TransferFungibleView && isActionsViewVisible ? (
          <TransferFungible />
        ) : actionsView === TransferNFTView ? (
          <TransferNFTs />
        ) : actionsView === TransferFeeCreditView ? (
          <TransferFeeCredit />
        ) : actionsView === NFTDetailsView ? (
          <NFTDetails />
        ) : actionsView === FungibleListView ? (
          <BillsList />
        ) : actionsView === NFTListView ? (
          <>
            <Spacer mt={24} />
            <AssetsList
              isTypeListItem
              assetList={NFTList}
              isTransferButton
              onItemClick={() => {
                setIsActionsViewVisible(true);
                setActionsView(NFTDetailsView);
              }}
              onSendClick={() => setPreviousView(NFTListView)}
            />
          </>
        ) : actionsView === ProfileView && accounts ? (
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
