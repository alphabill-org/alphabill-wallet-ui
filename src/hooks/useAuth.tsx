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
  setUserKeys: (e: any) => void;
}

const AuthContext = createContext<IUserContext>({
  userKeys: null,
  login: (e?: any) => {},
  logout: () => {},
  setUserKeys: (e: any) => {},
});

function AuthProvider(props: IUseLocalStorageProps): JSX.Element | null {
  const [userKeys, setUserKeys] = useLocalStorage("ab_wallet_pub_keys", null);

  const navigate = useNavigate();

  const login = async (data?: string | null) => {
    data && setUserKeys(data);
    navigate("/", { replace: true });
  };

  const logout = () => {
    navigate("/", { replace: true });
  };

  const value = {
    userKeys,
    login,
    logout,
    setUserKeys,
  };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
