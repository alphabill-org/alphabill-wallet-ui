import { createContext, PropsWithChildren, useCallback, useContext, useState } from "react";
import { useVault } from "./vault";

const AUTHENTICATED_LOCAL_STORAGE_KEY = "alphabill_authenticated";

interface IAuthenticationContext {
  readonly isLoggedIn: boolean;
  login(password: string): Promise<boolean>;
}

const AuthenticationContext = createContext<IAuthenticationContext | null>(null);

export function useAuthentication() {
  const context = useContext(AuthenticationContext);

  if (!context) {
    throw new Error("Invalid authentication context.");
  }

  return context;
}

export function AuthenticationProvider({ children }: PropsWithChildren<object>) {
  const { load } = useVault();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const storageAuthenticated = localStorage.getItem(AUTHENTICATED_LOCAL_STORAGE_KEY);
    if (!storageAuthenticated) {
      return false;
    }

    try {
      return JSON.parse(storageAuthenticated) as boolean;
    } catch (e) {
      console.error(e);
      return false;
    }
  });

  const login = useCallback(
    async (password: string): Promise<boolean> => {
      const result = await load(password);
      if (result) {
        setIsLoggedIn(true);
        localStorage.setItem(AUTHENTICATED_LOCAL_STORAGE_KEY, JSON.stringify(true));
      }

      return result;
    },
    [load, setIsLoggedIn],
  );

  return <AuthenticationContext.Provider value={{ login, isLoggedIn }}>{children}</AuthenticationContext.Provider>;
}
