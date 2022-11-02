import { Navigate } from "react-router-dom";
import { useApp } from "../hooks/appProvider";
import { useAuth } from "../hooks/useAuth";


export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): JSX.Element {
  const { userKeys } = useAuth();
  const { balance, balanceIsFetching } = useApp();

  if (!userKeys || (!balance && !balanceIsFetching)) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

export { ProtectedRoute };
