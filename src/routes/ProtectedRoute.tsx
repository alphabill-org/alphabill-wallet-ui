import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): JSX.Element {
  const { userKeys } = useAuth();
  if (!userKeys) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

export { ProtectedRoute };
