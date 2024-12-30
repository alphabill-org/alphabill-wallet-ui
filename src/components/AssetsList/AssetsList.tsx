import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";

import { useAuth } from "../../hooks/useAuth";
import { IActiveAsset, IBill } from "../../types/Types";
import { AlphaType, FungibleTokenKind } from "../../utils/constants";
import { invalidateAllLists, isBillLocked } from "../../utils/utils";
import AssetsListItem from "./AssetsListItem";

export interface IAssetsListProps {
  assetList: any;
  consolidationTargetUnit?: IBill;
  DCBills?: any;
  isTypeListItem?: boolean;
  onItemClick?: () => void;
  onSendClick?: (e: IActiveAsset) => void;
  isTransferButton?: boolean;
  isHoverDisabled?: boolean;
}

export default function AssetsList({
  assetList,
  consolidationTargetUnit,
  DCBills,
  isTypeListItem,
  onItemClick,
  isTransferButton,
  isHoverDisabled,
  onSendClick,
}: IAssetsListProps): JSX.Element | null {
  const { activeAccountId, activeAsset, setActiveAssetLocal, setActiveNFTLocal } = useAuth();

  const handleClick = (asset: any) => {
    setActiveAssetLocal(JSON.stringify(asset));
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };
  const queryClient = useQueryClient();

  return (
    <div
      className={classNames("assets-list", {
        single: isTypeListItem === true,
        "no-hover": isHoverDisabled === true,
      })}
    >
      {assetList?.map((asset: any) => {
        const isFungibleKind = asset?.kind === FungibleTokenKind || asset.typeId === AlphaType;
        const isLocked = consolidationTargetUnit && isBillLocked(consolidationTargetUnit, asset, DCBills);

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
            <div onClick={() => onItemClick && onItemClick()} className="assets-list__item-clicker"></div>
            <AssetsListItem
              asset={asset}
              isTypeListItem={isTypeListItem}
              isTransferButton={isTransferButton}
              handleClick={handleClick}
              onSendClick={onSendClick}
              isLocked={isLocked}
            />
          </div>
        );
      })}
    </div>
  );
}
