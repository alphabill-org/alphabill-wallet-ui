import classNames from "classnames";
import { useQueryClient } from "react-query";

import { AlphaType, FungibleTokenKind } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";
import { invalidateAllLists } from "../../utils/utils";
import { IActiveAsset } from "../../types/Types";
import AssetsListItem from "./AssetsListItem";

export interface IAssetsListProps {
  assetList: any;
  isTypeListItem?: boolean;
  onItemClick?: () => void;
  onSendClick?: (e: IActiveAsset) => void;
  isTransferButton?: boolean;
  isHoverDisabled?: boolean;
}

export default function AssetsList({
  assetList,
  isTypeListItem,
  onItemClick,
  isTransferButton,
  isHoverDisabled,
  onSendClick,
}: IAssetsListProps): JSX.Element | null {
  const {
    activeAccountId,
    activeAsset,
    setActiveAssetLocal,
    setActiveNFTLocal,
  } = useAuth();

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
            <AssetsListItem
              asset={asset}
              isTypeListItem={isTypeListItem}
              isTransferButton={isTransferButton}
              handleClick={handleClick}
              onSendClick={onSendClick}
            />
          </div>
        );
      })}
    </div>
  );
}
