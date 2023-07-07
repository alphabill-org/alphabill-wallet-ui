import classNames from "classnames";

import Button from "../components/Button/Button";
import { ReactComponent as Arrow } from "./../images/arrow.svg";
import { useApp } from "../hooks/appProvider";
import TransferFungible from "./components/TransferFungible";
import TransferFeeCredit from "./components/TransferFeeCredit";
import BillsList from "./components/BillsList/BillsList";
import AccountView from "./components/AccountView";
import { useAuth } from "../hooks/useAuth";
import TransferNFTs from "./components/TransferNFTs";
import Navbar from "../components/Navbar/Navbar";
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
import { IActionVies, INavbarViews } from "../types/Types";
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
    actionsView === TransferFungibleView || actionsView === TransferNFTView;

  return (
    <div
      className={classNames("actions", { "is-visible": isActionsViewVisible })}
    >
      <div className="actions__header">
        <Button
          onClick={() => {
            if (actionsView === NFTDetailsView) {
              setActionsView(NFTListView);
            } else if (previousView) {
              setActionsView(previousView as IActionVies);
            } else {
              setIsActionsViewVisible(!isActionsViewVisible);
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
            ? activeAsset?.name || activeAsset?.symbol
            : actionsView.replace("view", "")}
        </div>
      </div>
      <div className="actions__view">
        {isTransferView && (
          <>
            <Spacer mt={8} />
            <Navbar
              activeBar={
                actionsView === TransferFungibleView
                  ? "fungible"
                  : "nonFungible"
              }
              onChange={(isFungibleView: INavbarViews) => {
                setActionsView(
                  isFungibleView === "fungible"
                    ? TransferFungibleView
                    : TransferNFTView
                );
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
