import { IFungibleAsset, IAssetsColProps } from "../../../types/Types";
import { useApp } from "../../../hooks/appProvider";
import { AlphaType, FungibleListView } from "../../../utils/constants";
import AssetsList from "../../AssetsList/AssetsList";

export default function FungibleAssetsCol({
  isTitle,
}: IAssetsColProps): JSX.Element | null {
  const { setIsActionsViewVisible, setActionsView, account } = useApp();
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
    })
    .sort(function (a, b) {
      if (a.id === AlphaType) {
        return -1; // Move the ALPHA object to the beginning of the array
      }
      return 1;
    });

  return (
    <>
      {isTitle && sortedFungibleAssets?.length >= 1 && (
        <div className="pad-16-l">Fungible assets</div>
      )}
      <AssetsList
        assetList={sortedFungibleAssets}
        onItemClick={() => {
          setActionsView(FungibleListView);
          setIsActionsViewVisible(true);
        }}
      />
    </>
  );
}
