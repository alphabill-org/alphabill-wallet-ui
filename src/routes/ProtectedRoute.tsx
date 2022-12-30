import { useRef } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../hooks/appProvider";

export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): JSX.Element {
  const { balances } = useApp();
  const vault = localStorage.getItem("ab_wallet_vault");
  const userKeys = localStorage.getItem("ab_wallet_pub_keys");
  const isLocked = useRef<"locked" | "unlocked">();
  const isRedirect =
    !Boolean(userKeys) ||
    !Boolean(vault) ||
    !Boolean(balances) ||
    vault === "null" ||
    userKeys === "null";

  chrome?.storage?.local.get(["ab_is_wallet_locked"]).then((result) => {
    if (result.ab_is_wallet_locked === "locked") {
      localStorage.setItem("ab_wallet_pub_keys", "");
      return <Navigate to="/login" />;
    }
    isLocked.current = result.ab_is_wallet_locked;
  });

  chrome?.runtime?.onMessage.addListener(function (request) {
    if (request === "close") {
      isLocked.current = "locked";
      window.close();
    }
  });

  if (isRedirect || (isLocked.current === "locked" && chrome?.storage)) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

export { ProtectedRoute };
