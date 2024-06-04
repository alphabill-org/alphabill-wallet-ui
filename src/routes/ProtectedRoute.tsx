import ConnectPopup from "./ConnectPopup";
import { Navigate } from "react-router-dom";
import { ReactElement, useContext } from "react";
import { VaultContext } from "./Login/Login";

export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): ReactElement {
  const { keys } = useContext(VaultContext);
  // const { balances } = useApp();
  // const vault = localStorage.getItem(LocalKeyVault);
  // const userKeys = localStorage.getItem(LocalKeyPubKeys);
  // const [isLocked, setIsLocked] = useState<WalletStatus>();
  console.log(keys);

  if (!keys.length) {
    return <Navigate to="/login" />;
  }

  // const isRedirect =
  //   !userKeys ||
  //   !vault ||
  //   !balances ||
  //   vault === "null" ||
  //   userKeys === "null";

  // useEffect(() => {
  //   runtimeEnvironment?.storage.local
  //     .get([AlphabillData.ALPHABILL_WALLET_LOCKED])
  //     .then((result) => {
  //       const data = result as AlphabillDataObject;
  //       if (data[AlphabillData.ALPHABILL_WALLET_LOCKED] !== WalletStatus.UNLOCKED) {
  //         localStorage.setItem(LocalKeyPubKeys, "");
  //       }
  //
  //       setIsLocked(data[AlphabillData.ALPHABILL_WALLET_LOCKED] || WalletStatus.LOCKED);
  //     })
  //     .catch(() => {
  //       setIsLocked(WalletStatus.LOCKED);
  //       localStorage.setItem(LocalKeyPubKeys, "");
  //     });
  // }, [isLocked]);
  //
  // if (runtimeEnvironment && !isLocked) {
  //   return <></>;
  // }
  //
  // runtimeEnvironment?.runtime.onMessage.addListener((request) => {
  //   const { isLocked } = request as { isLocked: boolean };
  //   if (isLocked) {
  //     runtimeEnvironment?.storage.local
  //       .set({ [AlphabillData.ALPHABILL_WALLET_LOCKED] : WalletStatus.LOCKED })
  //       .then(() => window.close());
  //   }
  //   return true;
  // });
  //
  // if (isRedirect || isLocked === WalletStatus.LOCKED) {
  //   return <Navigate to="/login" />;
  // }

  return (
    <>
      <ConnectPopup />
      {children}
    </>
  );
}

export { ProtectedRoute };
