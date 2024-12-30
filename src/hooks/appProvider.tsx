import {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isEqual, sortBy } from "lodash";

import {
  IAccount,
  IActionViews,
  IBill,
  IFeeCreditBills,
  IListTokensResponse,
  INFTAsset,
} from "../types/Types";
import {
  useGetAllUserTokens,
  useGetBalances,
  useGetBillsList,
  useGetUserTokens,
  useGetAllNFTs,
  useGetNFTs,
  useGetFeeCreditBills,
} from "./api";
import { useAuth } from "./useAuth";
import {
  AlphaType,
  LocalKeyAccountNames,
  TransferNFTView,
} from "../utils/constants";
import {
  getUpdatedFungibleAssets,
  getUpdatedNFTAssets,
  removeConnectTransferData,
  unlockedBills,
} from "../utils/utils";
import Popup from "../components/Popup/Popup";

interface IAppContextShape {
  balances: any;
  billsList: any;
  unlockedBillsList: any;
  NFTList: IListTokensResponse[] | undefined;
  NFTsList: IListTokensResponse[] | undefined;
  accounts: IAccount[];
  setAccounts: (e: IAccount[]) => void;
  account: IAccount;
  isActionsViewVisible: boolean;
  setIsActionsViewVisible: (e: boolean) => void;
  actionsView: IActionViews;
  setActionsView: (e: IActionViews) => void;
  previousView: string | null;
  setPreviousView: (e: string | null) => void;
  selectedTransferKey: string | null | undefined;
  setSelectedTransferKey: (e: string | null) => void;
  selectedTransferAccountKey: string | null | undefined;
  setSelectedTransferAccountKey: (e: string | null) => void;
  feeCreditBills?: IFeeCreditBills;
}

export const AppContext = createContext<IAppContextShape>(
  {} as IAppContextShape
);

export const useApp = (): IAppContextShape => useContext(AppContext);

export const AppProvider: FunctionComponent<{
  children: JSX.Element | null;
}> = ({ children }) => {
  const {
    userKeys,
    setActiveAccountId,
    activeAccountId,
    activeAsset,
    activeNFT,
    setActiveAssetLocal,
  } = useAuth();
  const keysArr = useMemo(() => userKeys?.split(" ") || [], [userKeys]);
  const accountNames = localStorage.getItem(LocalKeyAccountNames) || "";
  const accountNamesObj = useMemo(
    () => (accountNames ? JSON.parse(accountNames) : {}),
    [accountNames]
  );
  const [selectedTransferKey, setSelectedTransferKey] = useState<
    string | null | undefined
  >();
  const [error, setError] = useState<string | null>(null);
  const [selectedTransferAccountKey, setSelectedTransferAccountKey] = useState<
    string | null | undefined
  >();
  const [previousView, setPreviousView] = useState<string | null>(null);
  const balances: any = useGetBalances(keysArr);
  const { data: alphaList } = useGetBillsList(activeAccountId);
  const { data: feeCreditBills } = useGetFeeCreditBills(activeAccountId);
  const { data: fungibleTokensList, isLoading: isLoadingFungibleTokens } =
    useGetAllUserTokens(activeAccountId);
  const { data: NFTsList, isLoading: isLoadingNFTs } =
    useGetAllNFTs(activeAccountId);
  const { data: fungibleTokenList } = useGetUserTokens(
    activeAccountId,
    activeAsset.typeId
  );
  const { data: NFTList } = useGetNFTs(
    activeAccountId,
    activeNFT && activeNFT.typeId
  );
  const billsList =
    activeAsset.typeId === AlphaType ? alphaList : fungibleTokenList;

  // Will be updated with lock transactions in v0.5.0
  const unlockedBillsList =
    activeAsset.typeId === AlphaType
      ? unlockedBills(billsList as IBill[])
      : fungibleTokenList;
  const [accounts, setAccounts] = useState<IAccount[] | []>([]);
  const account = useMemo(
    () =>
      accounts?.find(
        (account: IAccount) => account?.pubKey === activeAccountId
      )!,
    [accounts, activeAccountId]
  );
  const [isActionsViewVisible, setIsActionsViewVisible] =
    useState<boolean>(false);
  const [actionsView, setActionsView] = useState<IActionViews>("");

  // Used when getting keys from localStorage or fetching balance takes time
  useEffect(() => {
    const hasKeys = Number(keysArr?.length) >= 1;
    const assets = {
      fungible: getUpdatedFungibleAssets(
        fungibleTokensList,
        activeAccountId,
        balances
      ),
      nft:
        (getUpdatedNFTAssets(NFTsList) as INFTAsset[]) || [],
    };

    chrome?.storage?.local.get(["ab_connected_key"], function (keyRes) {
      chrome?.storage?.local.get(
        ["ab_connect_transfer"],
        function (transferRes) {
          const typeId = transferRes?.ab_connect_transfer?.token_type_id;

          if (typeId) {
            if (
              keyRes?.ab_connected_key &&
              activeAccountId !== keyRes?.ab_connected_key
            ) {
              setActiveAccountId(keyRes?.ab_connected_key);
            }
            const isNFT = assets.nft.find((nft) => nft?.typeId === typeId);

            if (isNFT) {
              setSelectedTransferAccountKey(
                transferRes?.ab_connect_transfer?.receiver_pub_key
              );
              setActiveAssetLocal(JSON.stringify(activeAsset));
              setActionsView(TransferNFTView);
              setIsActionsViewVisible(true);
              setSelectedTransferKey(isNFT.id);
            } else if (
              activeAccountId === keyRes?.ab_connected_key &&
              !isLoadingNFTs &&
              !isLoadingFungibleTokens
            ) {
              setError("No token with given type ID");
              removeConnectTransferData();
            }
          }
        }
      );
    });

    if (
      (hasKeys &&
        !isEqual(
          assets?.fungible,
          sortBy(account?.assets?.fungible, ["id"])
        )) ||
      (hasKeys &&
        !isEqual(
          sortBy(assets?.nft, ["id"]),
          sortBy(account?.assets?.nft, ["id"])
        )) ||
      keysArr?.length !== accounts.length
    ) {
      setAccounts(
        keysArr?.map((key, idx) => ({
          pubKey: key,
          idx: idx,
          name: accountNamesObj["_" + idx] || "Public key " + (idx + 1),
          assets: assets,
          activeNetwork: import.meta.env.VITE_NETWORK_NAME,
          activeAccount: activeAccountId,
          networks: [
            {
              id: import.meta.env.VITE_NETWORK_NAME,
              isTestNetwork: true,
            },
          ],
          activities:
            accounts?.find((account: IAccount) => account?.pubKey === key)
              ?.activities || [],
        }))
      );
      !activeAccountId && setActiveAccountId(keysArr[0]);
    }
  }, [
    accounts,
    keysArr,
    accountNamesObj,
    balances,
    activeAccountId,
    setActiveAccountId,
    activeAsset,
    fungibleTokensList,
    account?.assets,
    NFTsList,
    setActiveAssetLocal,
    account?.pubKey,
    isLoadingNFTs,
    isLoadingFungibleTokens,
  ]);

  return (
    <AppContext.Provider
      value={{
        NFTList,
        NFTsList,
        billsList,
        unlockedBillsList,
        balances,
        accounts,
        setAccounts,
        account,
        isActionsViewVisible,
        setIsActionsViewVisible,
        actionsView,
        setActionsView,
        selectedTransferKey,
        setSelectedTransferKey,
        selectedTransferAccountKey,
        setSelectedTransferAccountKey,
        previousView,
        setPreviousView,
        feeCreditBills,
      }}
    >
      {children}
      <Popup
        isPopupVisible={Boolean(error)}
        setIsPopupVisible={() => {
          setError(null);
        }}
        title="Error"
      >
        <div className="pad-24-t w-100p">
          <h2 className="c-error m-auto-r">{error}</h2>
        </div>
      </Popup>
    </AppContext.Provider>
  );
};
