import { useApp } from "../../../hooks/appProvider";
import { NFTListView } from "../../../utils/constants";
import { filterUniqueTypes, sortBySymbol, sortByTypeId } from "../../../utils/utils";
import AssetsList from "../../AssetsList/AssetsList";

export default function NFTAssetsCol(): JSX.Element | null {
  const { setIsActionsViewVisible, setActionsView, account } = useApp();
  const allNFTs = account?.assets?.nft;
  const sortedByTypeId = sortByTypeId(allNFTs);
  const uniqueTypes = filterUniqueTypes(sortedByTypeId);
  const sortedBySymbol = sortBySymbol(uniqueTypes);

  return (
    <AssetsList
      assetList={sortedBySymbol}
      onItemClick={() => {
        setActionsView(NFTListView);
        setIsActionsViewVisible(true);
      }}
    />
  );
}
