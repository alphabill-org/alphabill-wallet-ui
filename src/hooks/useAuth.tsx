import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { useLocalStorage } from "./useLocalStorage";

interface IUseLocalStorageProps {
  children: React.ReactNode;
}

interface IUserContext {
  userKeys: string | null;
  login: (e?: any) => void;
  logout: () => void;
  vault: string | null;
  setUserKeys: (e: any) => void;
  setVault: (e: any) => void;
}

const AuthContext = createContext<IUserContext>({
  userKeys: localStorage.getItem("ab_wallet_pub_keys"),
  vault: localStorage.getItem("ab_wallet_vault"),
  login: (e?: any) => {},
  logout: () => {},
  setUserKeys: (e: any) => {},
  setVault: (e: any) => {},
});

function AuthProvider(props: IUseLocalStorageProps): JSX.Element | null {
  const [userKeys, setUserKeys] = useLocalStorage(
    "ab_wallet_pub_keys",
    localStorage.getItem("ab_wallet_pub_keys")
  );
  const [vault, setVault] = useLocalStorage(
    "ab_wallet_vault",
    localStorage.getItem("ab_wallet_vault")
  );
  const navigate = useNavigate();

  const login = async (data?: string | null) => {
    data && setUserKeys(data);
    navigate("/", { replace: true });
  };

  const logout = () => {
    setUserKeys(null);
    navigate("/login", { replace: true });
  };

  const value = {
    userKeys,
    login,
    logout,
    setUserKeys,
    vault,
    setVault,
  };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
