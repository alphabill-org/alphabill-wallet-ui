import { createContext, FunctionComponent, useContext } from "react";
import { useGetBalance } from "./api";
import { useAuth } from "./useAuth";

interface IAppContextShape {
  balance: any;
  balanceIsLoading: boolean;
  balanceIsFetching: boolean;
}

export const AppContext = createContext<IAppContextShape>(
  {} as IAppContextShape
);

export const useApp = (): IAppContextShape => useContext(AppContext);

export const AppProvider: FunctionComponent<{
  children: JSX.Element | null;
}> = ({ children }) => {
  const { userKeys } = useAuth();

  const { data: balance, isLoading: balanceIsLoading , isFetching: balanceIsFetching} = useGetBalance(
    userKeys?.split(" ")[0]
  );

  return (
    <AppContext.Provider
      value={{
        balance,
        balanceIsLoading,
        balanceIsFetching
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
