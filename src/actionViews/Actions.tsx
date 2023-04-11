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
  NFTDetailsView as NFTDetailsActionView,
  NFTListView,
  NonFungibleTokenKind,
  ProfileView,
  TransferView,
} from "../utils/constants";
import NFTDetailsView from "./components/NFTDetailsView";
import { IListTokensResponse } from "../types/Types";

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
    NFTsList
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
            if (actionsView === NFTDetailsActionView) {
              setActionsView(NFTListView);
            } else {
              setIsActionsViewVisible(!isActionsViewVisible);
              actionsView === TransferView && setSelectedTransferKey(null);
            }
          }}
          className="btn__back"
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">
          {actionsView === NFTListView || NFTListView
            ? activeAsset?.name || activeAsset?.symbol
            : actionsView}
        </div>
      </div>
      <div className="actions__view">
        {actionsView === TransferView && (
          <>
            <Spacer mt={8} />
            <Navbar
              isFungibleActive={
                isFungibleActive && !selectedNFT
              }
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
        ) : actionsView === NFTDetailsActionView ? (
          <NFTDetailsView />
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
                setActionsView(NFTDetailsActionView);
              }}
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
