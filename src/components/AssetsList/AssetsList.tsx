import classNames from "classnames";

import { IActiveAsset, IBill } from "../../types/Types";
import AssetsListItem from "./AssetsListItem";

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
  return (
    <div
      className={classNames("assets-list", {
        single: isTypeListItem === true,
        "no-hover": isHoverDisabled === true,
      })}
    >
      {assetList?.map((asset: IActiveAsset) => (
        <AssetsListItem
          key={asset.id}
          isTypeListItem={isTypeListItem}
          onItemClick={onItemClick}
          onSendClick={onSendClick}
          asset={asset}
          setIsProofVisible={setIsProofVisible}
          isProofButton={isProofButton}
          isTransferButton={isTransferButton}
          isHoverDisabled={isHoverDisabled}
        />
      ))}
    </div>
  );
}
