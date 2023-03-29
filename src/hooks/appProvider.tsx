import {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isString, isEqual, sortBy } from "lodash";

import {
  IAccount,
  IFungibleResponse,
  IUserTokensListTypes,
} from "../types/Types";
import {
  useGetAllTokenTypes,
  useGetAllUserTokens,
  useGetBalances,
  useGetBillsList,
  useGetUserTokens,
} from "./api";
import { useAuth } from "./useAuth";
import { useLocalStorage } from "./useLocalStorage";
import { addDecimal, isTokenSendable, separateDigits } from "../utils/utils";
import {
  AlphaDecimalFactor,
  AlphaDecimalPlaces,
  AlphaType,
} from "../utils/constants";

interface IAppContextShape {
  balances: any;
  billsList: any;
  accounts: IAccount[];
  setAccounts: (e: IAccount[]) => void;
  account: IAccount;
  isActionsViewVisible: boolean;
  setIsActionsViewVisible: (e: boolean) => void;
  actionsView: "Transfer" | "List view" | "Profile" | "";
  setActionsView: (e: "Transfer" | "List view" | "Profile" | "") => void;
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
  const { data: userTokensList } = useGetAllUserTokens(activeAccountId);
  const { data: tokenList } = useGetUserTokens(
    activeAccountId,
    activeAsset.typeId
  );
  const { data: tokenTypes } = useGetAllTokenTypes(activeAccountId);
  const billsList = activeAsset.typeId === AlphaType ? alphaList : tokenList;
  const [accounts, setAccounts] = useState<IAccount[]>(
    keysArr?.map((key, idx) => ({
      pubKey: key,
      idx: idx,
      name: accountNamesObj["_" + idx],
      assets: [],
      activeNetwork: import.meta.env.VITE_NETWORK_NAME,
      networks: [
        {
          id: import.meta.env.VITE_NETWORK_NAME,
          isTestNetwork: true,
        },
      ],
      activities: [],
    }))
  );
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
    "Transfer" | "List view" | "Profile" | ""
  >("");

  // Used when getting keys from localStorage or fetching balance takes time
  useEffect(() => {
    let userTokens: any = [];
    let typeIDs: string[] = [];

    if (userTokensList) {
      for (let token of userTokensList) {
        if (!typeIDs.includes(token.typeId)) {
          typeIDs.push(token.typeId);
          userTokens.push({
            id: token.id, // base64 encoded hex
            typeId: token.typeId, // base64 encoded hex
            owner: token.owner, // base64 encoded hex - bearer predicate
            amount: token.amount, // fungible only
            kind: token.kind,
            decimals: token?.decimals || 0, // fungible only
            txHash: token.txHash, // base64 encoded hex - latest tx
            symbol: token.symbol,
          });
        } else {
          for (let resultToken of userTokens) {
            if (resultToken.typeId === token.typeId) {
              resultToken.amount = (
                BigInt(resultToken.amount) + BigInt(token.amount)
              ).toString();
            }
          }
        }
      }
    }

    const fungibleUTPAssets =
      userTokens?.map((obj: IFungibleResponse) => ({
        id: obj.id,
        typeId: obj.typeId,
        name: obj.symbol,
        network: import.meta.env.VITE_NETWORK_NAME,
        amount: obj.amount.toString(),
        decimalFactor: Number("1e" + obj.decimals),
        decimalPlaces: obj.decimals,
        isSendable: isTokenSendable(
          tokenTypes?.find(
            (type: IUserTokensListTypes) => type.id === obj.typeId
          )?.invariantPredicate!,
          activeAccountId
        ),
        UIAmount: separateDigits(addDecimal(obj.amount, obj?.decimals || 0)),
      })) || [];

    const hasKeys = Number(keysArr?.length) >= 1;

    const ALPHABalance = balances?.find(
      (balance: any) => balance?.data?.pubKey === activeAccountId
    )?.data?.balance;

    const alphaAsset = {
      id: AlphaType,
      name: AlphaType,
      network: import.meta.env.VITE_NETWORK_NAME,
      amount: ALPHABalance,
      decimalFactor: AlphaDecimalFactor,
      decimalPlaces: AlphaDecimalPlaces,
      UIAmount: separateDigits(
        addDecimal(ALPHABalance || "0", AlphaDecimalPlaces)
      ),
      typeId: AlphaType,
      isSendable: true,
    };

    const updatedAssets = sortBy(fungibleUTPAssets.concat([alphaAsset]), [
      "id",
    ]);

    if (
      (hasKeys && !isEqual(updatedAssets, sortBy(account?.assets, ["id"]))) ||
      keysArr?.length !== accounts.length
    ) {
      setAccounts(
        keysArr?.map((key, idx) => ({
          pubKey: key,
          idx: idx,
          name: accountNamesObj["_" + idx] || "Public key " + (idx + 1),
          assets: updatedAssets,
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
    userTokensList,
    tokenTypes,
    account?.assets,
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
