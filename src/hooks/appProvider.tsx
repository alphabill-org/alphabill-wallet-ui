import { createContext, FunctionComponent, useContext, useState } from "react";
import { IAccount } from "../types/Types";
import { useGetBalances } from "./api";
import { useAuth } from "./useAuth";

interface IAppContextShape {
  balances: any;
  activeAccountId: string;
  setActiveAccountId: (e: string) => void;
  accounts: IAccount[];
  setAccounts: (e: any) => void;
  account: IAccount | undefined;
  isActionsViewVisible: boolean;
  setIsActionsViewVisible: (e: boolean) => void;
  actionsView: string;
  setActionsView: (e: string) => void;
}

export const AppContext = createContext<IAppContextShape>(
  {} as IAppContextShape
);

export const useApp = (): IAppContextShape => useContext(AppContext);

export const AppProvider: FunctionComponent<{
  children: JSX.Element | null;
}> = ({ children }) => {
  const { userKeys } = useAuth();
  const keysArr = userKeys?.split(" ") || [];
  const accountNames = localStorage.getItem("ab_wallet_account_names") || "";
  const accountNamesObj = accountNames ? JSON.parse(accountNames) : {};
  const [activeAccountId, setActiveAccountId] = useState(keysArr[0] || "");
  const balances: any = useGetBalances(keysArr);
  const [accounts, setAccounts] = useState<IAccount[]>(
    keysArr.map((key, idx) => ({
      pubKey: key,
      idx: idx,
      name: accountNamesObj["_" + idx],
      assets: [
        {
          id: "AB",
          name: "AlphaBill Token",
          network: "AB Testnet",
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
  const account = accounts?.find(
    (account: IAccount) => account?.pubKey === activeAccountId
  );
  const [isActionsViewVisible, setIsActionsViewVisible] =
    useState<boolean>(false);
  const [actionsView, setActionsView] = useState("Buy");

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
