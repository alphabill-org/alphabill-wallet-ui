import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { useLocalStorage } from "./useLocalStorage";

interface IUseLocalStorageProps {
  children: React.ReactNode;
}

interface IUserContext {
  userKeys: string | null;
  login: (
    activeAccountId: string,
    keys: string | null,
    vaultData?: string
  ) => void;
  logout: () => void;
  vault: string | null;
  setUserKeys: (e: any) => void;
  setVault: (e: string) => void;
  activeAccountId: string;
  setActiveAccountId: (e: string) => void;
}

const keysData = localStorage.getItem("ab_wallet_pub_keys") || null;
const vaultData = localStorage.getItem("ab_wallet_vault") || null;
const keysArr = keysData?.split(" ") || [];
const activeAccountLocal =
  localStorage.getItem("ab_active_account") || keysArr[0] || "";
const initialActiveAccount = keysArr.includes(activeAccountLocal)
  ? activeAccountLocal
  : keysArr[0];

const AuthContext = createContext<IUserContext>({
  userKeys: keysData,
  vault: vaultData,
  login: () => {},
  logout: () => {},
  setUserKeys: (e: []) => {},
  setVault: (e: any) => {},
  activeAccountId: initialActiveAccount,
  setActiveAccountId: () => {},
});

function AuthProvider(props: IUseLocalStorageProps): JSX.Element | null {
  const [userKeys, setUserKeys] = useLocalStorage(
    "ab_wallet_pub_keys",
    keysData
  );
  const [activeAccountId, setActiveAccountId] = useLocalStorage(
    "ab_active_account",
    initialActiveAccount
  );
  const [vault, setVault] = useLocalStorage("ab_wallet_vault", vaultData);
  const navigate = useNavigate();

  const login = async (
    activeAccountId: string,
    keys: string | null,
    vaultData?: string
  ) => {
    const initiateLogin = () => {
      vaultData && setVault(vaultData);
      keys && setUserKeys(keys);
      setActiveAccountId(activeAccountId);
      navigate("/", { replace: true });
    };

    if (chrome?.storage) {
      chrome?.storage?.local
        .set({ ab_is_wallet_locked: "unlocked" })
        .then(() => initiateLogin());
    } else {
      initiateLogin();
    }
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
    activeAccountId,
    setActiveAccountId,
  };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
