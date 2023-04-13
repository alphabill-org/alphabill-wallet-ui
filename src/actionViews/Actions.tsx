import { useState } from "react";
import classNames from "classnames";

import Button from "../components/Button/Button";
import { ReactComponent as Arrow } from "./../images/arrow.svg";
import { useApp } from "../hooks/appProvider";
import TransferFungible from "./components/TransferFungible";
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
  NonFungibleTokenKind,
  ProfileView,
  TransferView,
} from "../utils/constants";
import NFTDetails from "./components/NFTDetails";
import { IActionVies, IListTokensResponse } from "../types/Types";

function Actions(): JSX.Element | null {
  const {
    isActionsViewVisible,
    setIsActionsViewVisible,
    actionsView,
    accounts,
    selectedTransferKey,
    setSelectedTransferKey,
    NFTList,
    setActionsView,
    NFTsList,
    setPreviousView,
    previousView,
  } = useApp();
  const { activeAsset } = useAuth();
  const selectedNFT = NFTsList?.find(
    (token: IListTokensResponse) => token.id === selectedTransferKey
  );
  const [isFungibleActive, setIsFungibleActive] = useState<boolean>(
    activeAsset?.kind !== NonFungibleTokenKind && !selectedNFT
  );

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
              actionsView === TransferView && setSelectedTransferKey(null);
            }

            if (TransferView) {
              setPreviousView(null);
              setSelectedTransferKey(null);
            }
          }}
          className="btn__back"
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">
          {actionsView === NFTListView || actionsView === FungibleListView
            ? activeAsset?.name || activeAsset?.symbol
            : actionsView}
        </div>
      </div>
      <div className="actions__view">
        {actionsView === TransferView && (
          <>
            <Spacer mt={8} />
            <Navbar
              isFungibleActive={isFungibleActive && !selectedNFT}
              onChange={(v: boolean) => {
                setIsFungibleActive(v);
                setSelectedTransferKey(null);
              }}
            />
          </>
        )}
        {actionsView === TransferView ? (
          isFungibleActive && !selectedNFT ? (
            <TransferFungible />
          ) : (
            <TransferNFTs />
          )
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
