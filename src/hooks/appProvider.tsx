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
  INFTAsset,
} from "../types/Types";
import {
  useGetAllTokenTypes,
  useGetAllUserTokens,
  useGetBalances,
  useGetBillsList,
  useGetUserTokens,
  useGetAllNFTs,
  useGetNFTs,
} from "./api";
import { useAuth } from "./useAuth";
import { AlphaType } from "../utils/constants";
import { getUpdatedFungibleAssets, getUpdatedNFTAssets } from "../utils/utils";

interface IAppContextShape {
  balances: any;
  billsList: any;
  accounts: IAccount[];
  setAccounts: (e: IAccount[]) => void;
  account: IAccount;
  isActionsViewVisible: boolean;
  setIsActionsViewVisible: (e: boolean) => void;
  actionsView:
    | "Transfer"
    | "Fungible list view"
    | "NFT list view"
    | "Profile"
    | "";
  setActionsView: (
    e: "Transfer" | "Fungible list view" | "NFT list view" | "Profile" | ""
  ) => void;
  selectedSendKey: string | null | undefined;
  setSelectedSendKey: (e: string | null) => void;
}

export const AppContext = createContext<IAppContextShape>(
  {} as IAppContextShape
);

export const useApp = (): IAppContextShape => useContext(AppContext);

export const AppProvider: FunctionComponent<{
  children: JSX.Element | null;
}> = ({ children }) => {
  const { userKeys, setActiveAccountId, activeAccountId, activeAsset } =
    useAuth();
  const keysArr = useMemo(() => userKeys?.split(" ") || [], [userKeys]);
  const accountNames = localStorage.getItem("ab_wallet_account_names") || "";
  const accountNamesObj = useMemo(
    () => (accountNames ? JSON.parse(accountNames) : {}),
    [accountNames]
  );
  const [selectedSendKey, setSelectedSendKey] = useState<
    string | null | undefined
  >();

  const balances: any = useGetBalances(keysArr);
  const { data: alphaList } = useGetBillsList(activeAccountId);
  const { data: fungibleTokensList } = useGetAllUserTokens(activeAccountId);
  const { data: NFTsList } = useGetAllNFTs(activeAccountId);
  const { data: fungibleTokenList } = useGetUserTokens(
    activeAccountId,
    activeAsset.typeId
  );
  const { data: NFTList } = useGetNFTs(activeAccountId, activeAsset.typeId);
  const { data: tokenTypes } = useGetAllTokenTypes(activeAccountId);
  const billsList =
    activeAsset.typeId === AlphaType ? alphaList : fungibleTokenList;
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
  const [actionsView, setActionsView] = useState<
    "Transfer" | "Fungible list view" | "NFT list view" | "Profile" | ""
  >("");

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

    if (
      (hasKeys &&
        !isEqual(assets.fungible, sortBy(account?.assets.fungible, ["id"]))) ||
      (hasKeys &&
        !isEqual(
          sortBy(assets.nft, ["id"]),
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
  ]);

  return (
    <AppContext.Provider
      value={{
        billsList,
        balances,
        accounts,
        setAccounts,
        account,
        isActionsViewVisible,
        setIsActionsViewVisible,
        actionsView,
        setActionsView,
        selectedSendKey,
        setSelectedSendKey,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
