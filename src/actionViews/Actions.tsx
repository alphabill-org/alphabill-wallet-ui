import classNames from "classnames";

import AssetsList from "../components/AssetsList/AssetsList";
import Button from "../components/Button/Button";
import Navbar from "../components/Navbar/Navbar";
import Spacer from "../components/Spacer/Spacer";
import { useApp } from "../hooks/appProvider";
import { useAuth } from "../hooks/useAuth";
import { IActionViews, INavbarViews } from "../types/Types";
import {
  FungibleListView,
  NFTDetailsView,
  NFTListView,
  ProfileView,
  TransferFeeCreditView,
  TransferFungibleView,
  TransferNFTView,
} from "../utils/constants";
import { removeConnectTransferData } from "../utils/utils";
import Arrow from "./../images/arrow.svg?react";
import AccountView from "./components/AccountView";
import BillsList from "./components/BillsList/BillsList";
import NFTDetails from "./components/NFTDetails";
import TransferFeeCredit from "./components/TransferFeeCredit";
import TransferFungible from "./components/TransferFungible";
import TransferNFTs from "./components/TransferNFTs";

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
  const isTransferView = actionsView === TransferFungibleView || actionsView === TransferNFTView;

  return (
    <div className={classNames("actions", { "is-visible": isActionsViewVisible })}>
      <div className="actions__header">
        <Button
          onClick={() => {
            if (actionsView === NFTDetailsView) {
              setActionsView(NFTListView);
            } else if (previousView) {
              setActionsView(previousView as IActionViews);
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
          <Arrow />
        </Button>
        <div className="actions__title">
          {actionsView === NFTListView || actionsView === FungibleListView
            ? activeAsset?.symbol
            : actionsView.replace("view", "")}
        </div>
      </div>
      <div className="actions__view">
        {isTransferView && (
          <>
            <Navbar
              activeBar={actionsView === TransferFungibleView ? "fungible" : "nonFungible"}
              onChange={(isFungibleView: INavbarViews) => {
                setActionsView(isFungibleView === "fungible" ? TransferFungibleView : TransferNFTView);
                setSelectedTransferKey(null);
                setPreviousView(null);
                removeConnectTransferData();
              }}
            />
          </>
        )}
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
