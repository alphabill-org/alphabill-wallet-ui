import { createContext, FunctionComponent, useContext, useState } from "react";
import { useGetBalance } from "./api";
import { useAuth } from "./useAuth";

interface IAppContextShape {
  balance: any;
  balanceIsLoading: boolean;
  balanceIsFetching: boolean;
  activeAccountId: string;
  setActiveAccountId: (e: string) => void;
}

export const AppContext = createContext<IAppContextShape>(
  {} as IAppContextShape
);

export const useApp = (): IAppContextShape => useContext(AppContext);

export const AppProvider: FunctionComponent<{
  children: JSX.Element | null;
}> = ({ children }) => {
  const { userKeys } = useAuth();
  const [activeAccountId, setActiveAccountId] = useState(
    userKeys?.split(" ")[0] || ""
  );

  const {
    data: balance,
    isLoading: balanceIsLoading,
    isFetching: balanceIsFetching,
  } = useGetBalance(activeAccountId);

  return (
    <AppContext.Provider
      value={{
        balance,
        balanceIsLoading,
        balanceIsFetching,
        activeAccountId,
        setActiveAccountId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
