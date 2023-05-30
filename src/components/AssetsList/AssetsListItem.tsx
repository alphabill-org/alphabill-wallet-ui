import classNames from "classnames";
import { useQueryClient } from "react-query";

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
import { useRef, useState } from "react";
import { useEffect } from "react";

export interface IAssetsListProps {
  asset: any;
  isTypeListItem?: boolean;
  onItemClick?: () => void;
  onSendClick?: (e: IActiveAsset) => void;
  setIsProofVisible?: (e: IBill) => void;
  isProofButton?: boolean;
  isTransferButton?: boolean;
  isHoverDisabled?: boolean;
}

export default function AssetsList({
  asset,
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
  const [rightSideElWidth, setRightSideElWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const rightSideRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleClick = (asset: any) => {
    setActiveAssetLocal(JSON.stringify(asset));
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  const hexId = base64ToHexPrefixed(asset?.id);
  const amount = asset.UIAmount || asset.amountOfSameType;
  const widthRatio =
    rightSideElWidth && containerWidth
      ? (rightSideElWidth * 100) / containerWidth / 7
      : 0;
  const hexVisibleLength = 11 - widthRatio;
  const hexIdEllipsis =
    hexId.substr(0, hexVisibleLength) +
    "..." +
    hexId.substr(hexId.length - hexVisibleLength, hexId.length);
  const label = isTypeListItem
    ? hexIdEllipsis
    : asset?.name || asset?.symbol || hexIdEllipsis;
  const isButtons = isProofButton || isTransferButton;
  const isFungibleKind =
    asset?.kind === FungibleTokenKind || asset.typeId === AlphaType;

  useEffect(() => {
    rightSideRef.current &&
      setRightSideElWidth(rightSideRef.current.offsetWidth);
    containerRef.current && setContainerWidth(containerRef.current.offsetWidth);
  }, [asset, activeAsset]);

  return (
    <div
      key={asset.id}
      className={classNames("assets-list__item", {
        "no-hover": isHoverDisabled === true,
      })}
      ref={containerRef}
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
      <div ref={rightSideRef} className="flex flex-align-c">
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
    </div>
  );
}
