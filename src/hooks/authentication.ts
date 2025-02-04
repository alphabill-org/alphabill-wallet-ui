import { createContext, useContext } from 'react';

export interface IAuthenticationContext {
  readonly isLoggedIn: boolean;
  login(password: string): Promise<boolean>;
  logout(): void;
}

export const Authentication = createContext<IAuthenticationContext | null>(null);

export function useAuthentication(): IAuthenticationContext {
  const context = useContext(Authentication);
  if (!context) {
    throw new Error('Invalid authentication context.');
  }
  return context;
}
