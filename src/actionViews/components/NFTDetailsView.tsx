import classNames from "classnames";
import { useQueryClient } from "react-query";
import { LazyLoadImage } from "react-lazy-load-image-component";

import { TransferView } from "../../utils/constants";
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

export interface INFTDetailsViewProps {
  onItemClick?: () => void;
}

export default function NFTDetailsView({
  onItemClick,
}: INFTDetailsViewProps): JSX.Element | null {
  const { activeAsset, activeAccountId } = useAuth();
  const queryClient = useQueryClient();
  const { setIsActionsViewVisible, setActionsView, setSelectedTransferKey } =
    useApp();
  const isDownloadButton =
    (activeAsset?.isImageUrl && activeAsset?.nftUri) || activeAsset?.nftData;

  const handleClick = (asset: any) => {
    onItemClick && onItemClick();
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  return (
    <div className={"asset-details pad-view"}>
      <div className="asset-details__head">
        <div className="asset-details__key">
          <div className="t-ellipsis">
            Unit ID {base64ToHexPrefixed(activeAsset?.id)}
          </div>
          <Button
            onClick={() => {
              setActionsView(TransferView);
              setIsActionsViewVisible(true);
              activeAsset && setSelectedTransferKey(activeAsset.id!);
              handleClick(activeAsset);
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
          "is-empty": !activeAsset?.nftUri,
        })}
      >
        {activeAsset?.nftUri ? (
          <LazyLoadImage
            alt={base64ToHexPrefixed(activeAsset?.id)}
            height={32}
            src={activeAsset?.nftUri}
            width={32}
          />
        ) : (
          <div>Unable to preview content</div>
        )}
      </div>
      <div className="asset-details__actions">
        {activeAsset?.isImageUrl && activeAsset?.nftUri && (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              downloadFile(
                activeAsset.nftUri!,
                base64ToHexPrefixed(activeAsset?.id)
              );
            }}
          >
            <Download />
            <div className="pad-8-l">Image</div>
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
            <div className="pad-8-l">Data</div>
          </Button>
        )}
      </div>
    </div>
  );
}
