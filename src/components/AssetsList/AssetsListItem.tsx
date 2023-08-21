import {
  AlphaType,
  FungibleTokenKind,
  TransferFungibleView,
  TransferNFTView,
} from "../../utils/constants";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { useAuth } from "../../hooks/useAuth";
import { base64ToHexPrefixed } from "../../utils/utils";
import Button from "../Button/Button";
import { useApp } from "../../hooks/appProvider";
import { IActiveAsset, IBill } from "../../types/Types";
import AssetsListItemIcon from "./AssetListItemIcon";
import { useRef, useState } from "react";
import { useEffect } from "react";

export interface IAssetsListProps {
  asset: any;
  isLocked?: boolean;
  isTypeListItem?: boolean;
  onSendClick?: (e: IActiveAsset) => void;
  handleClick: (e: IActiveAsset) => void | undefined;
  isTransferButton?: boolean;
}

export default function AssetsListItem({
  asset,
  isLocked,
  isTypeListItem,
  isTransferButton,
  handleClick,
  onSendClick,
}: IAssetsListProps): JSX.Element | null {
  const { activeAccountId, activeAsset } = useAuth();
  const { setIsActionsViewVisible, setActionsView, setSelectedTransferKey } =
    useApp();
  const hexId = base64ToHexPrefixed(asset?.id);
  const [itemRightElWidth, setItemRightElWidth] = useState(0);
  const itemRightElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    itemRightElRef.current &&
      setItemRightElWidth(itemRightElRef.current.offsetWidth);
  }, [activeAsset, activeAccountId]);
  const amount = asset.UIAmount || asset.amountOfSameType;
  const isButtons = isTransferButton;
  const isFungibleKind =
    asset?.kind === FungibleTokenKind || asset.typeId === AlphaType;

  const hexIdEllipsisLabel = (
    <div className="flex">
      ID:{" "}
      <span
        className="t-ellipsis"
        style={{
          maxWidth: 212 - itemRightElWidth,
        }}
      >
        {hexId}
      </span>
      <span>{hexId.substr(hexId.length - 6, hexId.length)}</span>
    </div>
  );

  const label = isTypeListItem
    ? hexIdEllipsisLabel
    : asset?.name || asset?.symbol || hexIdEllipsisLabel;

  return (
    <>
      <AssetsListItemIcon asset={asset} isTypeListItem={isTypeListItem} />
      <div className="assets-list__item-title">{label}</div>
      <div
        className="assets-list__item-right flex flex-align-c"
        ref={itemRightElRef}
      >
        {amount && <div className="assets-list__item-amount">{amount}</div>}
        {isButtons && (
          <div className="assets-list__item-actions">
            {isTransferButton && !isLocked && (
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
    </>
  );
}
