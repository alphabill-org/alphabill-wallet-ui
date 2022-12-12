import {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isString } from "lodash";

import { IAccount, ILockedBill } from "../types/Types";
import { useGetBalances, useGetBillsList } from "./api";
import { useAuth } from "./useAuth";
import { useLocalStorage } from "./useLocalStorage";

interface IAppContextShape {
  balances: any;
  billsList: any;
  activeAccountId: string;
  setActiveAccountId: (e: string) => void;
  accounts: IAccount[];
  setAccounts: (e: IAccount[]) => void;
  account: IAccount;
  isActionsViewVisible: boolean;
  setIsActionsViewVisible: (e: boolean) => void;
  actionsView: string;
  setActionsView: (e: string) => void;
  lockedBills: ILockedBill[];
  setLockedBillsLocal: (e: string) => void;
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
  const { userKeys } = useAuth();
  const keysArr = useMemo(() => userKeys?.split(" ") || [], [userKeys]);
  const accountNames = localStorage.getItem("ab_wallet_account_names") || "";
  const initialActiveAccount =
    localStorage.getItem("ab_active_account") || keysArr[0] || "";
  const initialLockedBills = localStorage.getItem("ab_locked_bills") || null;
  const accountNamesObj = useMemo(
    () => (accountNames ? JSON.parse(accountNames) : {}),
    [accountNames]
  );
  const [activeAccountId, setActiveAccountId] = useLocalStorage(
    "ab_active_account",
    initialActiveAccount
  );
  const [selectedSendKey, setSelectedSendKey] = useState<
    string | null | undefined
  >();
  const [lockedBillsLocal, setLockedBillsLocal] = useLocalStorage(
    "ab_locked_bills",
    initialLockedBills
  );
  const lockedBills: ILockedBill[] = lockedBillsLocal
    ? isString(lockedBillsLocal)
      ? JSON.parse(lockedBillsLocal)
      : lockedBillsLocal
    : [];
  const balances: any = useGetBalances(keysArr);
  const { data: billsList } = useGetBillsList(activeAccountId);
  const [accounts, setAccounts] = useState<IAccount[]>(
    keysArr.map((key, idx) => ({
      pubKey: key,
      idx: idx,
      name: accountNamesObj["_" + idx],
      assets: [
        {
          id: "ALPHA",
          name: "Alphabill Token",
          network: "AB Testnet",
          amount: balances?.find((balance: any) => balance?.data?.id === key)
            ?.data?.balance,
        },
      ],
      activeNetwork: "AB Testnet",
      networks: [
        {
          id: "AB Testnet",
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
  const [actionsView, setActionsView] = useState("Request");

  // Used when getting keys from localStorage or fetching balance takes time
  useEffect(() => {
    const abAccountBalance = accounts
      ?.find((account) => account?.pubKey === activeAccountId)
      ?.assets.find((asset) => asset.id === "ALPHA")?.amount;
    const abFetchedBalance = balances?.find(
      (balance: any) => balance?.data?.id === activeAccountId
    )?.data?.balance;

    if (
      (accounts.length <= 0 && keysArr.length >= 1) ||
      (keysArr.length >= 1 && abFetchedBalance !== abAccountBalance) ||
      keysArr.length > accounts.length
    ) {
      setAccounts(
        keysArr.map((key, idx) => ({
          pubKey: key,
          idx: idx,
          name: accountNamesObj["_" + idx] || "Account " + (idx + 1),
          assets: [
            {
              id: "ALPHA",
              name: "AlphaBill Token",
              network: "AB Testnet",
              amount: abFetchedBalance,
            },
          ],
          activeNetwork: "AB Testnet",
          networks: [
            {
              id: "AB Testnet",
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
  ]);

  return (
    <AppContext.Provider
      value={{
        billsList,
        balances,
        activeAccountId,
        setActiveAccountId,
        accounts,
        setAccounts,
        account,
        isActionsViewVisible,
        setIsActionsViewVisible,
        actionsView,
        setActionsView,
        lockedBills,
        setLockedBillsLocal,
        selectedSendKey,
        setSelectedSendKey,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
