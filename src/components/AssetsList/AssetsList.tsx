import classNames from "classnames";
import { useQueryClient } from "react-query";
import { LazyLoadImage } from "react-lazy-load-image-component";

import {
  AlphaType,
  FungibleTokenKind,
  TransferFungibleView,
  TransferNFTView,
} from "../../utils/constants";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as Proof } from "../../images/proof.svg";
import { useAuth } from "../../hooks/useAuth";
import { base64ToHexPrefixed, invalidateAllLists } from "../../utils/utils";
import Button from "../Button/Button";
import { useApp } from "../../hooks/appProvider";
import { IActiveAsset, IBill } from "../../types/Types";
import AssetsListItemIcon from "./AssetListItemIcon";

export interface IAssetsListProps {
  assetList: any;
  isTypeListItem?: boolean;
  onItemClick?: () => void;
  onSendClick?: (e: IActiveAsset) => void;
  setIsProofVisible?: (e: IBill) => void;
  isProofButton?: boolean;
  isTransferButton?: boolean;
  isHoverDisabled?: boolean;
}

export default function AssetsList({
  assetList,
  isTypeListItem,
  onItemClick,
  setIsProofVisible,
  isTransferButton,
  isProofButton,
  isHoverDisabled,
  onSendClick,
}: IAssetsListProps): JSX.Element | null {
  const {
    activeAccountId,
    activeAsset,
    setActiveAssetLocal,
    setActiveNFTLocal,
  } = useAuth();
  const queryClient = useQueryClient();
  const { setIsActionsViewVisible, setActionsView, setSelectedTransferKey } =
    useApp();

  const handleClick = (asset: any) => {
    setActiveAssetLocal(JSON.stringify(asset));
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  return (
    <div
      className={classNames("assets-list", {
        single: isTypeListItem === true,
        "no-hover": isHoverDisabled === true,
      })}
    >
      {assetList?.map((asset: any) => {
        const hexId = base64ToHexPrefixed(asset?.id);
        const label = isTypeListItem
          ? hexId
          : asset?.name || asset?.symbol || hexId;
        const amount = asset.UIAmount || asset.amountOfSameType;
        const isButtons = isProofButton || isTransferButton;
        const isFungibleKind =
          asset?.kind === FungibleTokenKind || asset.typeId === AlphaType;

        return (
          <div
            key={asset.id}
            className={classNames("assets-list__item", {
              "no-hover": isHoverDisabled === true,
            })}
            onClick={() => {
              handleClick(asset);
              !isFungibleKind && setActiveNFTLocal(asset);
            }}
          >
            <div
              onClick={() => onItemClick && onItemClick()}
              className="assets-list__item-clicker"
            ></div>
            <AssetsListItemIcon asset={asset} isTypeListItem={isTypeListItem} />
            <div className="assets-list__item-title">{label}</div>
            {amount && <div className="assets-list__item-amount">{amount}</div>}
            {isButtons && (
              <div className="assets-list__item-actions">
                {isProofButton && (
                  <Button
                    onClick={() => {
                      setIsProofVisible && setIsProofVisible(asset);
                      handleClick(asset);
                      queryClient.invalidateQueries([
                        "proof",
                        base64ToHexPrefixed(asset.id),
                      ]);
                    }}
                    type="button"
                    variant="icon"
                  >
                    <Proof />
                  </Button>
                )}

                {isTransferButton && (
                  <Button
                    onClick={() => {
                      setActionsView(
                        isFungibleKind ? TransferFungibleView : TransferNFTView
                      );
                      setIsActionsViewVisible(true);
                      setSelectedTransferKey(asset.id);
                      handleClick(asset);
                      onSendClick && onSendClick(asset);
                    }}
                    type="button"
                    variant="icon"
                  >
                    <Send />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
