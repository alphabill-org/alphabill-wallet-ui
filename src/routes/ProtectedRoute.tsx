import { Navigate } from "react-router-dom";
import { LocalKeyPubKeys, LocalKeyVault } from "../utils/constants";

export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): JSX.Element {
  const { balances } = useApp();
  const vault = localStorage.getItem(LocalKeyVault);
  const userKeys = localStorage.getItem(LocalKeyPubKeys);
  const isRedirect = !userKeys || !vault || !balances || vault === "null" || userKeys === "null";

  if (isRedirect) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

export { ProtectedRoute };
