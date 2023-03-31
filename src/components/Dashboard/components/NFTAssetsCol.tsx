import { useQueryClient } from "react-query";

import Button from "../../Button/Button";
import { INFTAsset } from "../../../types/Types";
import {
  filterUniqueTypes,
  invalidateAllLists,
  sortBySymbol,
  sortByTypeId,
} from "../../../utils/utils";
import { useApp } from "../../../hooks/appProvider";
import { useAuth } from "../../../hooks/useAuth";

export default function NFTAssetsCol(): JSX.Element | null {
  const { setIsActionsViewVisible, setActionsView, account } = useApp();
  const { activeAccountId, activeAsset, setActiveAssetLocal } = useAuth();
  const queryClient = useQueryClient();
  const allNFTs = account?.assets?.nft;
  const sortedByTypeId = sortByTypeId(allNFTs);
  const uniqueTypes = filterUniqueTypes(sortedByTypeId);
  const sortedBySymbol = sortBySymbol(uniqueTypes);

  return (
    <div className="dashboard__info-col">
      {sortedBySymbol?.map((asset: INFTAsset, idx: number) => {
        return (
          <div
            key={idx}
            className="dashboard__info-item-wrap"
            onClick={() => {
              setActiveAssetLocal(
                JSON.stringify({
                  name: asset.symbol,
                  typeId: asset.typeId,
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
              <div className="utp-icon">{(asset as INFTAsset)?.symbol[0]}</div>
            </div>
            <div className="dashboard__info-item-desc">
              <span className="t-ellipsis pad-8-r">
                {asset.amountOfSameType || 0}
              </span>
              <span className="t-ellipsis">{asset?.symbol}</span>
            </div>

            <Button
              variant="primary"
              className="m-auto-l"
              small
              onClick={() => {
                setActionsView("NFT list view");
                setIsActionsViewVisible(true);
                invalidateAllLists(
                  activeAccountId,
                  activeAsset.typeId,
                  queryClient
                );
              }}
            >
              Show All
            </Button>
          </div>
        );
      })}
    </div>
  );
}
