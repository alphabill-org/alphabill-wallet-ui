import classNames from "classnames";
import { useQueryClient } from "react-query";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { NFTListView, TransferNFTView } from "../../utils/constants";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as Download } from "../../images/download.svg";
import { useAuth } from "../../hooks/useAuth";
import {
  base64ToHexPrefixed,
  downloadHexFile,
  invalidateAllLists,
} from "../../utils/utils";
import { useApp } from "../../hooks/appProvider";
import Button from "../../components/Button/Button";
import { downloadFile } from "../../hooks/requests";
import { useGetImageUrlAndDownloadType } from "../../hooks/api";
import Spinner from "../../components/Spinner/Spinner";

export interface INFTDetailsProps {
  onItemClick?: () => void;
}

export default function NFTDetails({
  onItemClick,
}: INFTDetailsProps): JSX.Element | null {
  const { activeAsset, activeAccountId } = useAuth();
  const queryClient = useQueryClient();
  const nftUri = activeAsset?.nftUri || "";
  const { data, isLoading } = useGetImageUrlAndDownloadType(nftUri);
  const isImage = Boolean(data?.imageUrl) && !Boolean(data?.error);
  const isDownloadableImage =
    Boolean(data?.downloadType) && Boolean(data?.imageUrl);
  const isDownloadableImageWithError =
    isDownloadableImage && Boolean(data?.error);

  const {
    setIsActionsViewVisible,
    setActionsView,
    setSelectedTransferKey,
    setPreviousView,
  } = useApp();

  const handleClick = () => {
    onItemClick && onItemClick();
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  if (isLoading) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={"asset-details pad-view"}>
      <div className="asset-details__head">
        <div className="asset-details__key">
          <div className="t-ellipsis">
            Unit ID {base64ToHexPrefixed(activeAsset?.id)}
          </div>
          <Button
            onClick={() => {
              setActionsView(TransferNFTView);
              setIsActionsViewVisible(true);
              activeAsset && setSelectedTransferKey(activeAsset.id!);
              handleClick();
              setPreviousView(NFTListView);
            }}
            type="button"
            variant="icon"
          >
            <Send height="14" width="14" />
          </Button>
        </div>
      </div>
      <div
        className={classNames("asset-details__content", {
          "is-empty": !isImage,
        })}
      >
        {isImage ? (
          <LazyLoadImage
            alt={base64ToHexPrefixed(activeAsset?.id)}
            height={32}
            src={activeAsset?.nftUri}
            width={32}
          />
        ) : (
          <div>
            <div>Unable to preview {data?.downloadType} content.</div>
            {isDownloadableImageWithError && (
              <div>{data?.error}. Download image to preview.</div>
            )}
          </div>
        )}
      </div>
      <div className="asset-details__actions">
        {Boolean(data?.downloadType) && Boolean(data?.imageUrl) && (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              downloadFile(
                data?.imageUrl!,
                base64ToHexPrefixed(activeAsset?.id)
              );
            }}
          >
            <Download />
            <div className="pad-8-l t-ellipsis">{data?.downloadType}</div>
          </Button>
        )}

        {activeAsset?.nftData && (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              downloadHexFile(
                activeAsset.nftData!,
                base64ToHexPrefixed(activeAsset?.id)
              );
            }}
          >
            <Download />
            <div className="pad-8-l ">Data</div>
          </Button>
        )}
      </div>
    </div>
  );
}
