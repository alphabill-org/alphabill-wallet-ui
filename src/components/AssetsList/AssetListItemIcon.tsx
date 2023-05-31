import classNames from "classnames";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { AlphaType } from "../../utils/constants";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { Base64imageComponent, base64ToHexPrefixed } from "../../utils/utils";
import { useGetImageUrl } from "../../hooks/api";
import Spinner from "../Spinner/Spinner";

export interface IAssetsListItemIconProps {
  asset: any;
  isTypeListItem: boolean | undefined;
}

export default function AssetsListItemIcon({
  asset,
  isTypeListItem,
}: IAssetsListItemIconProps): JSX.Element | null {
  const hexId = base64ToHexPrefixed(asset?.id);
  const nftUri = asset?.nftUri || "";
  const { data: imageResponse, isLoading: isLoadingImage } = useGetImageUrl(
    nftUri,
    Boolean(isTypeListItem)
  );
  const label = isTypeListItem ? hexId : asset?.name || asset?.symbol || hexId;
  const iconEmblem = (asset?.name || asset?.symbol || hexId)[0];
  const withImage =
    !Boolean(imageResponse?.error) &&
    Boolean(imageResponse?.imageUrl) &&
    isTypeListItem;
  let icon;

  if (asset.iconImage) {
    return <Base64imageComponent base64Data={asset.iconImage} alt={asset.id} />;
  } else {
    if (withImage && isLoadingImage) {
      return (
        <div className="m-auto">
          <Spinner />
        </div>
      );
    }

    if (withImage) {
      icon = (
        <LazyLoadImage
          alt={label}
          height={32}
          src={imageResponse?.imageUrl as string}
          width={32}
        />
      );
    } else {
      icon = iconEmblem;
    }
  }
  return (
    <div className={classNames("assets-list__item-icon")}>
      {asset?.typeId === AlphaType ? <ABLogo /> : icon}
    </div>
  );
}
