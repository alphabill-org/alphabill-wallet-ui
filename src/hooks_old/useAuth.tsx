import { isString } from "lodash";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IActiveAsset } from "../types/Types";
import {
  AlphaType,
  LocalKeyActiveAccount,
  LocalKeyActiveAsset,
  LocalKeyNFTAsset,
  LocalKeyPubKeys,
  LocalKeyVault,
} from "../utils/constants";
import { publicKeyHash } from "../utils/hashers";
import { useLocalStorage } from "./useLocalStorage";

interface IUseLocalStorageProps {
  children: React.ReactNode;
}

interface IUserContext {
  userKeys: string | null;
  login: (activeAccountId: string, keys: string | null, vaultData?: string) => void;
  logout: () => void;
  vault: string | null;
  setUserKeys: (e: any) => void;
  setVault: (e: string) => void;
  activeAccountId: string;
  setActiveAccountId: (e: string) => void;
  activeAsset: IActiveAsset;
  setActiveAssetLocal: (e: string) => void;
  activeNFT: IActiveAsset | null;
  setActiveNFTLocal: (e: string) => void;
  pubKeyHash: string;
}

const keysData = localStorage.getItem(LocalKeyPubKeys) || null;
const vaultData = localStorage.getItem(LocalKeyVault) || null;
const keysArr = keysData?.split(" ") || [];
const activeAccountLocal = localStorage.getItem(LocalKeyActiveAccount) || keysArr[0] || "";
const initialActiveAccount = keysArr.includes(activeAccountLocal) ? activeAccountLocal : keysArr[0];
const initialActiveAsset =
  localStorage.getItem(LocalKeyActiveAsset) ||
  JSON.stringify({
    name: AlphaType,
    typeId: AlphaType,
  });

const AuthContext = createContext<IUserContext>({
  userKeys: keysData,
  vault: vaultData,
  login: () => {},
  logout: () => {},
  setUserKeys: (e: []) => {},
  setVault: (e: any) => {},
  activeAccountId: initialActiveAccount,
  setActiveAccountId: () => {},
  activeAsset: { name: AlphaType, typeId: AlphaType },
  setActiveAssetLocal: () => {},
  activeNFT: null,
  setActiveNFTLocal: () => {},
  pubKeyHash: "",
});

function AuthProvider(props: IUseLocalStorageProps): JSX.Element | null {
  const [pubKeyHash, setPubKeyHash] = useState<string>("");
  const [userKeys, setUserKeys] = useLocalStorage(LocalKeyPubKeys, keysData);
  const [activeAccountId, setActiveAccountId] = useLocalStorage(LocalKeyActiveAccount, initialActiveAccount);

  const [activeAssetLocal, setActiveAssetLocal] = useLocalStorage(LocalKeyActiveAsset, initialActiveAsset);

  const [activeNFTLocal, setActiveNFTLocal] = useLocalStorage(LocalKeyNFTAsset, initialActiveAsset);

  const activeNFT = activeNFTLocal ? (isString(activeNFTLocal) ? JSON.parse(activeNFTLocal) : activeNFTLocal) : [];

  const activeAsset = activeAssetLocal
    ? isString(activeAssetLocal)
      ? JSON.parse(activeAssetLocal)
      : activeAssetLocal
    : [];

  const [vault, setVault] = useLocalStorage(LocalKeyVault, vaultData);
  const navigate = useNavigate();

  useEffect(() => {
    const publicKey = publicKeyHash(activeAccountId);
    setPubKeyHash(publicKey);
  }, [activeAccountId]);

  const login = async (activeAccountId: string, keys: string | null, vaultData?: string) => {
    const initiateLogin = () => {
      vaultData && setVault(vaultData);
      keys && setUserKeys(keys);
      setActiveAccountId(activeAccountId);
      navigate("/", { replace: true });
    };

    initiateLogin();
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
    activeAsset,
    setActiveAssetLocal,
    activeNFT,
    setActiveNFTLocal,
    pubKeyHash,
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;
