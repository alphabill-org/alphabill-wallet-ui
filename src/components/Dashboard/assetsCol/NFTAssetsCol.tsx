import {
  filterUniqueTypes,
  sortBySymbol,
  sortByTypeId,
} from "../../../utils/utils";
import { useApp } from "../../../hooks/appProvider";
import AssetsList from "../../AssetsList/AssetsList";
import { NFTListView } from "../../../utils/constants";
import { IAssetsColProps } from "../../../types/Types";

export default function NFTAssetsCol({
  isTitle,
}: IAssetsColProps): JSX.Element | null {
  const { setIsActionsViewVisible, setActionsView, account } = useApp();
  const allNFTs = account?.assets?.nft;
  const sortedByTypeId = sortByTypeId(allNFTs);
  const uniqueTypes = filterUniqueTypes(sortedByTypeId);
  const sortedBySymbol = sortBySymbol(uniqueTypes);

  return (
    <>
      {isTitle && allNFTs?.length >= 1 && (
        <div className="pad-16-l">Non Fungible assets</div>
      )}
      <AssetsList
        assetList={sortedBySymbol}
        onItemClick={() => {
          setActionsView(NFTListView);
          setIsActionsViewVisible(true);
        }}
      />
    </>
  );
}
