import { Navigate } from "react-router-dom";
import { useApp } from "../hooks/appProvider";
import { useAuth } from "../hooks/useAuth";

export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): JSX.Element {
  const { userKeys, vault } = useAuth();

  if (!Boolean(userKeys) || !Boolean(vault)) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

export { ProtectedRoute };
