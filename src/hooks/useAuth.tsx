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

const keysData = localStorage.getItem("ab_wallet_pub_keys") || null;
const vaultData = localStorage.getItem("ab_wallet_vault") || null;

const AuthContext = createContext<IUserContext>({
  userKeys: keysData,
  vault: vaultData,
  login: (e?: any) => {},
  logout: () => {},
  setUserKeys: (e: any) => {},
  setVault: (e: any) => {},
});

function AuthProvider(props: IUseLocalStorageProps): JSX.Element | null {
  const [userKeys, setUserKeys] = useLocalStorage(
    "ab_wallet_pub_keys",
    keysData
  );
  const [vault, setVault] = useLocalStorage("ab_wallet_vault", vaultData);
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
