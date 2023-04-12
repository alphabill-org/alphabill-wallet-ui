import classNames from "classnames";
import { useQueryClient } from "react-query";
import { LazyLoadImage } from "react-lazy-load-image-component";

import {
  AlphaType,
  FungibleListView,
  FungibleTokenKind,
  NFTListView,
  NonFungibleTokenKind,
  TransferView,
} from "../../utils/constants";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as Proof } from "../../images/proof.svg";
import { useAuth } from "../../hooks/useAuth";
import { base64ToHexPrefixed, invalidateAllLists } from "../../utils/utils";
import Button from "../Button/Button";
import { useApp } from "../../hooks/appProvider";
import { IActiveAsset, IBill } from "../../types/Types";

export interface IAssetsListProps {
  assetList: any;
  isTypeListItem?: boolean;
  onItemClick?: () => void;
  onSendClick?: (e: IActiveAsset) => void;
  setIsProofVisible?: (e: IBill) => void;
  isProofButton?: boolean;
  isTransferButton?: boolean;
  isHoverDisabled?: boolean;
}

export default function AssetsList({
  assetList,
  isTypeListItem,
  onItemClick,
  setIsProofVisible,
  isTransferButton,
  isProofButton,
  isHoverDisabled,
  onSendClick,
}: IAssetsListProps): JSX.Element | null {
  const { activeAccountId, activeAsset, setActiveAssetLocal } = useAuth();
  const queryClient = useQueryClient();
  const { setIsActionsViewVisible, setActionsView, setSelectedTransferKey } =
    useApp();

  const handleClick = (asset: any) => {
    setActiveAssetLocal(JSON.stringify(asset));
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  return (
    <div
      className={classNames("assets-list", {
        single: isTypeListItem === true,
        "no-hover": isHoverDisabled === true,
      })}
    >
      {assetList?.map((asset: any) => {
        const hexId = base64ToHexPrefixed(asset?.id);
        const label = isTypeListItem
          ? hexId
          : asset?.name || asset?.symbol || hexId;
        const iconEmblem = (asset?.name || asset?.symbol || hexId)[0];
        const amount = asset.UIAmount || asset.amountOfSameType;
        const isButtons = isProofButton || isTransferButton;
        let icon = null;

        if (asset?.isImageUrl && isTypeListItem) {
          icon = (
            <LazyLoadImage
              alt={label}
              height={32}
              src={asset?.nftUri}
              width={32}
            />
          );
        } else {
          icon = iconEmblem;
        }

        return (
          <div
            key={asset.id}
            className={classNames("assets-list__item", {
              "no-hover": isHoverDisabled === true,
            })}
            onClick={() => handleClick(asset)}
          >
            <div
              onClick={() => onItemClick && onItemClick()}
              className="assets-list__item-clicker"
            ></div>
            <div className="assets-list__item-icon">
              {asset?.typeId === AlphaType ? <ABLogo /> : icon}
            </div>
            <div className="assets-list__item-title">{label}</div>
            {amount && <div className="assets-list__item-amount">{amount}</div>}
            {isButtons && (
              <div className="assets-list__item-actions">
                {isProofButton &&
                  asset?.kind !== FungibleTokenKind &&
                  asset?.kind !== NonFungibleTokenKind && (
                    <Button
                      onClick={() => {
                        setIsProofVisible && setIsProofVisible(asset);
                        handleClick(asset);
                        queryClient.invalidateQueries([
                          "proof",
                          base64ToHexPrefixed(asset.id),
                        ]);
                      }}
                      type="button"
                      variant="icon"
                    >
                      <Proof />
                    </Button>
                  )}

                {isTransferButton && (
                  <Button
                    onClick={() => {
                      setActionsView(TransferView);
                      setIsActionsViewVisible(true);
                      setSelectedTransferKey(asset.id);
                      handleClick(asset);
                      onSendClick && onSendClick(asset)
                    }}
                    type="button"
                    variant="icon"
                  >
                    <Send />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
