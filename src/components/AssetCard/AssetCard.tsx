import classNames from "classnames"
import Button from "../Button/Button";
import { ICRight } from "../../css/icons";
import { ICFeeLimit } from "../../css/icons/ICFeeLimit";
import AssetCardIcon from "./AssetCardIcon/AssetCardIcon";
import { IFungibleAsset, INFTAsset } from "../../types/Types";

export interface IAssetCardProps {
  isMini?: boolean,
  asset : IFungibleAsset | INFTAsset;
  isFungible: boolean
}

export const AssetCard = ({isMini, asset, isFungible}: IAssetCardProps) => {
  const className = classNames(
    "asset-card",
    {
      "asset-card--mini": isMini,
    }
  );

  const bodyClassName = isMini ? "asset-card-body-mini" : "asset-card-body"

  return (
    <div className={className}>
      <div className="asset-card-header">
        <AssetCardIcon 
          asset={asset} 
          isTypeListItem={false}
        />
      </div>
      <div className={bodyClassName}>
        <div className={`${bodyClassName}__asset-title`}>
          {asset.id}
        </div>
        {isFungible && 
          <div className={`${bodyClassName}__asset-amount`}>
            {(asset as IFungibleAsset).UIAmount}
          </div>}
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