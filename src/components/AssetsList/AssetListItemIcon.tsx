import { TokenIcon } from "@alphabill/alphabill-js-sdk/lib/tokens/TokenIcon";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import classNames from "classnames";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { useGetImageUrl } from "../../hooks/api";
import ABLogo from "../../images/ab-logo-ico.svg?react";
import { AlphaType } from "../../utils/constants";
import { Base64imageComponent, base64ToHexPrefixed } from "../../utils/utils";
import Spinner from "../Spinner/Spinner";

export interface IAssetsListItemIconProps {
  asset: any;
  isTypeListItem: boolean | undefined;
}

export default function AssetsListItemIcon({ asset, isTypeListItem }: IAssetsListItemIconProps): JSX.Element | null {
  const hexId = base64ToHexPrefixed(asset?.id);
  const nftUri = asset?.nftUri || "";
  const { data: imageResponse, isLoading: isLoadingImage } = useGetImageUrl(nftUri, Boolean(isTypeListItem));
  const label = isTypeListItem ? hexId : asset?.nftName || asset?.symbol || hexId;

  const iconEmblem = (asset?.nftName || asset?.symbol || hexId)[0];
  const withImage = !imageResponse?.error && Boolean(imageResponse?.imageUrl) && isTypeListItem;
  let icon;
  const tokenIcon: TokenIcon = asset.icon;
  const wrapClass = classNames("assets-list__item-icon", {
    "is-image": tokenIcon || withImage,
  });

  if (tokenIcon) {
    return (
      <div className={wrapClass}>
        <Base64imageComponent
          base64Data={{
            type: tokenIcon.type,
            data: Base16Converter.encode(tokenIcon.data), // TODO: No longer base 64
          }}
          alt={asset.id}
        />
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
      icon = <LazyLoadImage alt={label} height={32} src={imageResponse?.imageUrl as string} width={32} />;
    } else {
      icon = iconEmblem;
    }
  }
  return <div className={wrapClass}>{asset?.typeId === AlphaType ? <ABLogo /> : icon}</div>;
}
