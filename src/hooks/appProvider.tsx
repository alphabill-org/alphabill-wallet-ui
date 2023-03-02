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
import {
  addDecimal,
  ALPHADecimalFactor,
  ALPHADecimalPlaces,
} from "../utils/utils";

interface IAppContextShape {
  balances: any;
  billsList: any;
  accounts: IAccount[];
  setAccounts: (e: IAccount[]) => void;
  account: IAccount;
  isActionsViewVisible: boolean;
  setIsActionsViewVisible: (e: boolean) => void;
  actionsView: "Send" | "Bills List" | "Profile" | "";
  setActionsView: (e: "Send" | "Bills List" | "Profile" | "") => void;
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
  const { userKeys, setActiveAccountId, activeAccountId, activeAssetId } =
    useAuth();
  const keysArr = useMemo(() => userKeys?.split(" ") || [], [userKeys]);
  const accountNames = localStorage.getItem("ab_wallet_account_names") || "";
  const initialLockedBills = localStorage.getItem("ab_locked_bills") || null;
  const accountNamesObj = useMemo(
    () => (accountNames ? JSON.parse(accountNames) : {}),
    [accountNames]
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
          name: "ALPHA",
          network: "AB Testnet",
          amount: balances?.find(
            (balance: any) => balance?.data?.pubKey === key
          )?.data?.balance,
          decimalFactor: ALPHADecimalFactor,
          decimalPlaces: ALPHADecimalPlaces,
          UIAmount:
            addDecimal(
              balances?.find((balance: any) => balance?.data?.pubKey === key)
                ?.data?.balance.toString(),
              ALPHADecimalPlaces
            ) || "0",
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
  const [actionsView, setActionsView] = useState<
    "Send" | "Bills List" | "Profile" | ""
  >("");

  // Used when getting keys from localStorage or fetching balance takes time
  useEffect(() => {
    const accountBalance = accounts
      ?.find((account) => account?.pubKey === activeAccountId)
      ?.assets.find((asset) => asset.id === activeAssetId)?.amount;
    const fetchedBalance = balances?.find(
      (balance: any) => balance?.data?.pubKey === activeAccountId
    )?.data?.balance;

    if (
      (keysArr.length >= 1 && fetchedBalance !== accountBalance) ||
      keysArr.length !== accounts.length
    ) {
      setAccounts(
        keysArr.map((key, idx) => ({
          pubKey: key,
          idx: idx,
          name: accountNamesObj["_" + idx] || "Public key " + (idx + 1),
          assets: [
            {
              id: "ALPHA",
              name: "ALPHA",
              network: "AB Testnet",
              amount: fetchedBalance,
              decimalFactor: ALPHADecimalFactor,
              decimalPlaces: ALPHADecimalPlaces,
              UIAmount: addDecimal(fetchedBalance.toString(), ALPHADecimalPlaces) || "0",
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
    activeAssetId,
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
