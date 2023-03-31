import { useQueryClient } from "react-query";

import { ReactComponent as ABLogo } from "../../../images/ab-logo-ico.svg";

import Button from "../../Button/Button";
import { IFungibleAsset } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";
import { AlphaType } from "../../../utils/constants";
import { invalidateAllLists } from "../../../utils/utils";

function FungibleAssetsCol(): JSX.Element | null {
  const { setIsActionsViewVisible, setActionsView, account } = useApp();
  const { activeAccountId, activeAsset, setActiveAssetLocal } = useAuth();
  const queryClient = useQueryClient();
  const sortedFungibleAssets = account?.assets?.fungible
    ?.filter((asset) => asset.network === account?.activeNetwork)
    ?.sort((a: IFungibleAsset, b: IFungibleAsset) => {
      if (a?.id! < b?.id!) {
        return -1;
      }
      if (a?.id! > b?.id!) {
        return 1;
      }
      return 0;
    });

  return (
    <div className="dashboard__info-col">
      {sortedFungibleAssets?.sort(function (a, b) {
          if (a.id === AlphaType) {
            return -1; // Move the object with the given ID to the beginning of the array
          }
          return 1;
        })
        .map((asset: IFungibleAsset | IFungibleAsset, idx: number) => {
          return (
            <div
              key={idx}
              className="dashboard__info-item-wrap"
              onClick={() => {
                setActiveAssetLocal(
                  JSON.stringify({
                    name: asset.name,
                    typeId: asset.typeId,
                    decimalFactor: asset.decimalFactor,
                    decimalPlaces: asset.decimalPlaces,
                  })
                );
                invalidateAllLists(
                  activeAccountId,
                  activeAsset.typeId,
                  queryClient
                );
              }}
            >
              <div className="dashboard__info-item-icon">
                {asset?.id === AlphaType ? (
                  <div className="icon-wrap ab-logo">
                    <ABLogo />
                  </div>
                ) : (
                  <div className="utp-icon">
                    {(asset as IFungibleAsset)?.name[0]}
                  </div>
                )}
              </div>
              <div className="dashboard__info-item-desc">
                <span className="t-ellipsis pad-8-r">
                  {asset.UIAmount || 0}
                </span>
                <span className="t-ellipsis">{asset?.name}</span>
              </div>

              <Button
                variant="primary"
                className="m-auto-l"
                small
                onClick={() => {
                  setActionsView("Fungible list view");
                  setIsActionsViewVisible(true);
                  invalidateAllLists(
                    activeAccountId,
                    activeAsset.typeId,
                    queryClient
                  );
                }}
              >
                Show {asset?.id === AlphaType ? " Bills" : " Tokens"}
              </Button>
            </div>
          );
        })}
    </div>
  );
}

export default FungibleAssetsCol;
