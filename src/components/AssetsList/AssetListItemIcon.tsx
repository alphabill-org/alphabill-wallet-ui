import { LazyLoadImage } from "react-lazy-load-image-component";

import { AlphaType } from "../../utils/constants";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { Base64imageComponent, base64ToHexPrefixed } from "../../utils/utils";
import { useGetImageUrl } from "../../hooks/api";
import Spinner from "../Spinner/Spinner";
import { ITokensListTypes } from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import classNames from "classnames";

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
  const label = isTypeListItem
    ? hexId
    : asset?.nftName || asset?.symbol || hexId;
  const iconEmblem = (asset?.nftName || asset?.symbol || hexId)[0];
  const withImage =
    !Boolean(imageResponse?.error) &&
    Boolean(imageResponse?.imageUrl) &&
    isTypeListItem;
  let icon;
  const tokenTypeIcon = tokenTypes?.find(
    (type: ITokensListTypes) => type.id === asset.typeId
  )?.icon;
  const wrapClass = classNames("assets-list__item-icon", {
    "is-image": tokenTypeIcon || withImage,
  });

  if (tokenTypeIcon) {
    return (
      <div className={wrapClass}>
        <Base64imageComponent base64Data={tokenTypeIcon} alt={asset.id} />
      </div>
    );
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
    <div className={wrapClass}>
      {asset?.typeId === AlphaType ? <ABLogo /> : icon}
    </div>
  );
}
