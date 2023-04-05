import classNames from "classnames";
import { useQueryClient } from "react-query";

import {
  AlphaType,
  FungibleTokenKind,
  NonFungibleTokenKind,
} from "../../utils/constants";
import { ReactComponent as ABLogo } from "../../images/ab-logo-ico.svg";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as Proof } from "../../images/proof.svg";
import { useAuth } from "../../hooks/useAuth";
import { base64ToHexPrefixed, invalidateAllLists } from "../../utils/utils";
import Button from "../Button/Button";
import { useApp } from "../../hooks/appProvider";
import { IBill } from "../../types/Types";

export interface IAssetsListProps {
  assetList: any;
  isSingle?: boolean;
  onItemClick?: () => void;
  setIsProofVisible?: (e: IBill) => void;
  isProofButton?: boolean;
  isTransferButton?: boolean;
  isHoverDisabled?: boolean;
}

export default function AssetsList({
  assetList,
  isSingle,
  onItemClick,
  setIsProofVisible,
  isTransferButton,
  isProofButton,
  isHoverDisabled,
}: IAssetsListProps): JSX.Element | null {
  const { activeAccountId, activeAsset, setActiveAssetLocal } = useAuth();
  const queryClient = useQueryClient();
  const { setIsActionsViewVisible, setActionsView, setSelectedSendKey } =
    useApp();

  const handleClick = (asset: any) => {
    onItemClick && onItemClick();
    setActiveAssetLocal(JSON.stringify(asset));
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  return (
    <div
      className={classNames("assets-list", {
        single: isSingle === true,
        "no-hover": isHoverDisabled === true,
      })}
    >
      {assetList?.map((asset: any) => {
        const hexId = base64ToHexPrefixed(asset?.id);
        const label = isSingle ? hexId : asset?.name || asset?.symbol || hexId;
        const iconEmblem = (asset?.name || asset?.symbol || hexId)[0];
        const amount = asset.UIAmount || asset.amountOfSameType;
        const isButtons = isProofButton || isTransferButton;
        return (
          <div
            key={asset.id}
            className={classNames("assets-list__item", {
              "no-hover": isHoverDisabled === true,
            })}
            onClick={() => handleClick(asset)}
          >
            <div className="assets-list__item-icon">
              {asset?.typeId === AlphaType ? <ABLogo /> : iconEmblem}
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
                      setActionsView("Transfer");
                      setIsActionsViewVisible(true);
                      setSelectedSendKey(asset.id);
                      handleClick(asset);
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
