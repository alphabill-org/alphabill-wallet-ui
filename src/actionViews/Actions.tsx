import classNames from "classnames";

import Button from "../components/Button/Button";
import Arrow from "./../images/arrow.svg?react";
import AccountView from "./components/AccountView";
// import { NFTDetailsView, TransferFungibleView } from "../utils/constants";
// import { removeConnectTransferData } from "../utils/utils";
import { ReactElement } from "react";

function Actions({title}: {title: string}): ReactElement | null {

  // const { activeAsset } = useAuth();
  // const isTransferView =
  //   actionsView === TransferFungibleView || actionsView === TransferNFTView;

  return (
    <div
      className={classNames("actions", { "is-visible": true })}
    >
      <div className="actions__header">
        <Button
          onClick={() => {

          }}
          className="btn__back"
          variant="icon"
        >
          <Arrow />
        </Button>
        <div className="actions__title">
         {/*actionsView === NFTListView || actionsView === FungibleListView ? activeAsset?.symbol :*/}
          {title}
        </div>
      </div>
      <div className="actions__view">
        {/*isTransferView && (
          <>
            <Spacer mt={8} />
            <Navbar
              activeBar={
                actionsView === TransferFungibleView
                  ? "fungible"
                  : "nonFungible"
              }
              onChange={(isFungibleView: INavbarViews) => {
                // setActionsView(
                //   isFungibleView === "fungible"
                //     ? TransferFungibleView
                //     : TransferNFTView
                // );
                // setSelectedTransferKey(null);
                // setPreviousView(null);
                removeConnectTransferData();
              }}
            />
          </>
        )*/}
        {/*
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
        ) : actionsView === ProfileView ? ( // && accounts ? (
          <AccountView />
        ) : (
          <></>
        )}
        */}
        <div className="actions__footer"></div>
      </div>
    </div>
  );
}

export default Actions;
