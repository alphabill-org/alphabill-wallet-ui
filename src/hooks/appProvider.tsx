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
  IActionVies,
  IBill,
  IFeeCreditBills,
  IListTokensResponse,
  INFTAsset,
  ITokensListTypes,
} from "../types/Types";
import {
  useGetAllTokenTypes,
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
  actionsView: IActionVies;
  setActionsView: (e: IActionVies) => void;
  previousView: string | null;
  setPreviousView: (e: string | null) => void;
  selectedTransferKey: string | null | undefined;
  setSelectedTransferKey: (e: string | null) => void;
  selectedTransferAccountKey: string | null | undefined;
  setSelectedTransferAccountKey: (e: string | null) => void;
  feeCreditBills?: IFeeCreditBills;
  tokenTypes: ITokensListTypes[] | undefined;
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
    pubKeyHash,
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
  const { data: feeCreditBills } = useGetFeeCreditBills(pubKeyHash);
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
  const { data: tokenTypes, isLoading: isLoadingTokenTypes } =
    useGetAllTokenTypes(activeAccountId);
  const billsList =
    activeAsset.typeId === AlphaType ? alphaList : fungibleTokenList;

  // Will be updated with lock transactions in v0.3.1
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
  const [actionsView, setActionsView] = useState<IActionVies>("");

  // Used when getting keys from localStorage or fetching balance takes time
  useEffect(() => {
    const hasKeys = Number(keysArr?.length) >= 1;
    const assets = {
      fungible: getUpdatedFungibleAssets(
        fungibleTokensList,
        tokenTypes,
        activeAccountId,
        balances
      ),
      nft:
        (getUpdatedNFTAssets(
          NFTsList,
          tokenTypes,
          activeAccountId
        ) as INFTAsset[]) || [],
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
              !isLoadingFungibleTokens &&
              !isLoadingTokenTypes
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
    tokenTypes,
    account?.assets,
    NFTsList,
    setActiveAssetLocal,
    account?.pubKey,
    isLoadingNFTs,
    isLoadingTokenTypes,
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
        tokenTypes,
      }}
    >
      {children}
      <Popup
        isPopupVisible={Boolean(error)}
        setIsPopupVisible={(v) => {
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
