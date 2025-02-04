import { PropsWithChildren, ReactElement, useCallback, useState } from 'react';

import { Authentication } from '../authentication';
import { useVault } from '../vault';

const AUTHENTICATED_LOCAL_STORAGE_KEY = 'alphabill_authenticated';

export function AuthenticationProvider({ children }: PropsWithChildren): ReactElement {
  const { unlock } = useVault();
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
      const result = await unlock(password);
      if (result) {
        setIsLoggedIn(true);
        localStorage.setItem(AUTHENTICATED_LOCAL_STORAGE_KEY, JSON.stringify(true));
      }
      return result;
    },
    [unlock, setIsLoggedIn],
  );

  const logout = useCallback((): void => {
    setIsLoggedIn(false);
    localStorage.removeItem(AUTHENTICATED_LOCAL_STORAGE_KEY);
  }, []);

  return (
    <Authentication.Provider value={{ isLoggedIn, login, logout }}>{children}</Authentication.Provider>
  );
}
