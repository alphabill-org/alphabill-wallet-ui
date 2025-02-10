import { createContext, useContext } from 'react';

export interface IAuthenticationContext {
  readonly isLoggedIn: boolean;
  login(password: string): Promise<boolean>;
  logout(): void;
}

export const AuthenticationContext = createContext<IAuthenticationContext | null>(null);

export function useAuthentication(): IAuthenticationContext {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error('Invalid authentication context.');
  }
  return context;
}
