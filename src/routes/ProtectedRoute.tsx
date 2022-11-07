import { Navigate } from "react-router-dom";
import { useApp } from "../hooks/appProvider";
import { useAuth } from "../hooks/useAuth";

export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): JSX.Element {
  const { balances } = useApp();
  const vault = localStorage.getItem("ab_wallet_vault");
  const userKeys = localStorage.getItem("ab_wallet_pub_keys");

  if (
    !Boolean(userKeys) ||
    !Boolean(vault) ||
    !Boolean(balances) ||
    vault === "null" ||
    userKeys === "null"
  ) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

export { ProtectedRoute };
