import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { LazyLoadImage } from "react-lazy-load-image-component";

import Button from "../../components/Button/Button";
import Spacer from "../../components/Spacer/Spacer";
import Spinner from "../../components/Spinner/Spinner";
import { useGetImageUrlAndDownloadType } from "../../hooks/api";
import { useApp } from "../../hooks/appProvider";
import { downloadFile } from "../../hooks/requests";
import { useAuth } from "../../hooks/useAuth";
import Download from "../../images/download.svg?react";
import Send from "../../images/send-ico.svg?react";
import { NFTListView, TransferNFTView } from "../../utils/constants";
import { downloadHexFile, invalidateAllLists } from "../../utils/utils";

export interface INFTDetailsProps {
  onItemClick?: () => void;
}

export default function NFTDetails({ onItemClick }: INFTDetailsProps): JSX.Element | null {
  const { activeAsset, activeAccountId } = useAuth();
  const queryClient = useQueryClient();
  const nftUri = activeAsset?.nftUri || "";
  const { data, isLoading } = useGetImageUrlAndDownloadType(nftUri);
  const isImage = Boolean(data?.imageUrl) && !data?.error;
  const isDownloadableImage = Boolean(data?.downloadType) && Boolean(data?.imageUrl);
  const isDownloadableImageWithError = isDownloadableImage && Boolean(data?.error);
  const prefixedID = activeAsset?.id!;

  const { setIsActionsViewVisible, setActionsView, setSelectedTransferKey, setPreviousView } = useApp();

  const handleClick = () => {
    onItemClick && onItemClick();
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  const isImageAndType = Boolean(data?.downloadType) && Boolean(data?.imageUrl);

  if (isLoading) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={"asset-details pad-view"}>
      <div
        className={classNames("asset-details__content", {
          "is-empty": !isImage,
        })}
      >
        {isImage ? (
          <LazyLoadImage alt={activeAsset?.id} height={32} src={activeAsset?.nftUri} width={32} />
        ) : (
          <div>
            <div>Unable to preview {data?.downloadType} content.</div>
            {isDownloadableImageWithError && <div>{data?.error}. Download image to preview.</div>}
          </div>
        )}
      </div>
      <div className="asset-details__actions">
        <Button
          onClick={() => {
            setActionsView(TransferNFTView);
            setIsActionsViewVisible(true);
            activeAsset && setSelectedTransferKey(activeAsset.id!);
            handleClick();
            setPreviousView(NFTListView);
          }}
          type="button"
          variant="primary"
        >
          <Send height="16" width="16" />
          <div className="pad-8-l">Transfer</div>
        </Button>
      </div>
      <Spacer mt={16} />
      <div className="asset-details__footer">
        <div className="asset-details__info">
          <div className="asset-details__info--item">
            <div className="flex">
              ID: <span className="t-ellipsis pad-8-l mw-200px">{prefixedID}</span>
              <span>{prefixedID.substr(prefixedID.length - 12, prefixedID.length)}</span>
            </div>
          </div>
          {activeAsset?.nftName && (
            <div className="asset-details__info--item">
              <div>Name: </div> <div>{activeAsset?.nftName}</div>
            </div>
          )}
          {activeAsset?.nftUri && (
            <div className="asset-details__info--item">
              <div>URL: </div>
              <div>{activeAsset?.nftUri}</div>
            </div>
          )}

          {(isImageAndType || activeAsset?.nftData) && (
            <div className="asset-details__actions">
              {Boolean(data?.downloadType) && Boolean(data?.imageUrl) && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    downloadFile(data?.imageUrl!, activeAsset?.id!);
                  }}
                  small
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
                    downloadHexFile(activeAsset.nftData!, activeAsset?.id!);
                  }}
                  small
                >
                  <Download />
                  <div className="pad-8-l ">Data</div>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
