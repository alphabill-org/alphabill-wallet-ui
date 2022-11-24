import { Navigate } from "react-router-dom";
import { useApp } from "../hooks/appProvider";

export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): JSX.Element {
  const { balances } = useApp();
  const vault = localStorage.getItem("ab_wallet_vault");
  const userKeys = localStorage.getItem("ab_wallet_pub_keys");

  if (
    userKeys!.length <= 0 ||
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