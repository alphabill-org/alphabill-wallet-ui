import { TokenIcon } from "@alphabill/alphabill-js-sdk/lib/tokens/TokenIcon";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import classNames from "classnames";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { useGetImageUrl } from "../../../hooks/api";
import ABLogo from "../../../images/ab-logo-ico.svg?react";
import { AlphaType } from "../../../utils/constants";
import { Base64imageComponent, base64ToHexPrefixed } from "../../../utils/utils";
import Spinner from "../../Spinner/Spinner";

export interface IAssetCardIconProps {
  asset: any;
  isTypeListItem: boolean | undefined;
}

export default function AssetCardIcon({ asset, isTypeListItem }: IAssetCardIconProps): JSX.Element | null {
  const hexId = base64ToHexPrefixed(asset?.id);
  const nftUri = asset?.nftUri || "";
  const { data: imageResponse, isLoading: isLoadingImage } = useGetImageUrl(nftUri, Boolean(isTypeListItem));
  const label = isTypeListItem ? hexId : asset?.nftName || asset?.symbol || hexId;

  const iconEmblem = (asset?.nftName || asset?.symbol || hexId)[0];
  const isImageAvailable = !imageResponse?.error && imageResponse?.imageUrl && isTypeListItem;

  const tokenIcon: TokenIcon = asset.icon;
  const wrapClass = classNames("asset-card-icon", {
    "is-image": tokenIcon || isImageAvailable,
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
  }

  if (isImageAvailable) {
    if (isLoadingImage) {
      return (
        <div className="m-auto">
          <Spinner />
        </div>
      );
    }

    return (
      <div className={wrapClass}>
        <LazyLoadImage alt={label} height={32} src={imageResponse?.imageUrl as string} width={32} />
      </div>
    );
  }

  return <div className={wrapClass}>{asset?.typeId === AlphaType ? <ABLogo /> : iconEmblem}</div>;
}
