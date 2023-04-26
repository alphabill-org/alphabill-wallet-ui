import classNames from "classnames";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { AlphaType } from "../../utils/constants";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { base64ToHexPrefixed } from "../../utils/utils";
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
  const { data: imageUrl, isLoading: isLoadingImage } = useGetImageUrl(
    nftUri,
    Boolean(isTypeListItem)
  );
  const label = isTypeListItem ? hexId : asset?.name || asset?.symbol || hexId;
  const iconEmblem = (asset?.name || asset?.symbol || hexId)[0];
  const withImage = Boolean(imageUrl) && isTypeListItem;
  let icon;

  if (withImage && isLoadingImage) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  if (Boolean(imageUrl) && withImage) {
    icon = (
      <LazyLoadImage
        alt={label}
        height={32}
        src={imageUrl as string}
        width={32}
      />
    );
  } else {
    icon = iconEmblem;
  }

  return (
    <div className={classNames("assets-list__item-icon")}>
      {asset?.typeId === AlphaType ? <ABLogo /> : icon}
    </div>
  );
}
