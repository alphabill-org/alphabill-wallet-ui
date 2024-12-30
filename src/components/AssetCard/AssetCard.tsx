import classNames from "classnames"
import Button from "../Button/Button";
import { ICRight } from "../../css/icons";
import { ICFeeLimit } from "../../css/icons";
import AssetCardIcon from "./AssetCardIcon/AssetCardIcon";
import { IFungibleAsset, INFTAsset } from "../../types/Types";

export interface IAssetCardProps {
  isMini?: boolean,
  asset : IFungibleAsset | INFTAsset;
  isFungible?: boolean
}

export const AssetCard = ({isMini, asset, isFungible}: IAssetCardProps) => {
  const className = classNames(
    "asset-card",
    {
      "asset-card--mini": isMini,
    }
  );

  const bodyClassName = classNames(
    {
      "asset-card-body": !isMini,
      "asset-card-body-mini": isMini,
    }
  )

  const titleClassName = classNames(
    {
      [`${bodyClassName}__asset-title--nft`]: !isFungible && !isMini,
      [`${bodyClassName}__asset-title`]: isFungible || isMini,
      [`${bodyClassName}--center`]: !isFungible && !isMini
    }
  )

  const amountClassName = classNames(
    {
      [`${bodyClassName}__asset-amount--nft`]: !isFungible && !isMini,
      [`${bodyClassName}__asset-amount`]: isFungible || isMini
    }
  )

  const amount = isFungible 
    ? (asset as IFungibleAsset).UIAmount
    : (asset as INFTAsset).amountOfSameType

  const label = isFungible 
  ? (asset as IFungibleAsset).id
  : (asset as INFTAsset).symbol

  return (
    <div className={className}>
      <div className="asset-card-header">
        <AssetCardIcon 
          asset={asset} 
          isTypeListItem={false}
        />
      </div>
      <div className={bodyClassName}>
        <div className={titleClassName}>
          {label}
        </div>
        <div className={amountClassName}>
          {amount}
        </div>
      </div>
      <div className="asset-card-footer">
        <Button variant="icon" >
          <ICFeeLimit/>   
          {!isMini &&
            <div className="pad-8-l">
              Transaction fee limit
            </div>
          }
        </Button>
        <Button variant="secondary" className="asset-card-footer__button">
          <ICRight color="#08E8DE" className="asset-card-footer__button-icon"/>
        </Button>
        <div className="asset-card-sphere"></div>
      </div>
    </div>
  )
}