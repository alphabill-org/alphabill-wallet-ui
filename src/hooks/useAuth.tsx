import { createContext, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";

interface IUseLocalStorageProps {
  children: React.ReactNode;
}

interface IUserContext {
  user: string | null;
  login: (e: any) => void;
  logout: () => void;
}

const AuthContext = createContext<IUserContext>({
  user: null,
  login: (e: any) => {},
  logout: () => {},
});

function AuthProvider(props: IUseLocalStorageProps): JSX.Element | null {
  const [user, setUser] = useLocalStorage("ab_wallet_keys", null);
  const navigate = useNavigate();

  const login = async (data: string | null) => {
    setUser(data);
    navigate("/", { replace: true });
  };

  const logout = () => {
    setUser(null);
    navigate("/", { replace: true });
  };

  const value = {
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
