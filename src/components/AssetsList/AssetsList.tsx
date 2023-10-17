import classNames from "classnames";
import { useQueryClient } from "react-query";

import { AlphaType, FungibleTokenKind } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";
import { invalidateAllLists, isBillLocked } from "../../utils/utils";
import { IActiveAsset, IBill } from "../../types/Types";
import AssetsListItem from "./AssetsListItem";
import Button from "../Button/Button";
import { ReactComponent as Arrow } from "../../images/arrow-ico.svg";

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
        "assets-list__items-big": isTypeListItem !== true && assetList?.length >= 1,
        "no-hover": isHoverDisabled === true,
      })}
    >
      {assetList?.map((asset: any) => {
        const isFungibleKind =
          asset?.kind === FungibleTokenKind || asset.typeId === AlphaType;
        const isLocked =
          consolidationTargetUnit &&
          isBillLocked(consolidationTargetUnit, asset, DCBills);

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
              className="assets-list__item-clicker"
              onClick={() => onItemClick && onItemClick()}
            ></div>
            <AssetsListItem
              asset={asset}
              isTypeListItem={isTypeListItem}
              isTransferButton={isTransferButton}
              handleClick={handleClick}
              onSendClick={onSendClick}
              isLocked={isLocked}
            />
            {isTypeListItem !== true && (
              <Button
                onClick={() => onItemClick && onItemClick()}
                type="button"
                variant="icon"
                className="assets-list__item-button"
                isIcoBg
              >
                <Arrow />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
