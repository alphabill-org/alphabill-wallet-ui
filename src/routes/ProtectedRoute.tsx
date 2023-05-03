import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../hooks/appProvider";
import ConnectPopup from "./ConnectPopup";

export interface IProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: IProtectedRouteProps): JSX.Element {
  const { balances } = useApp();
  const vault = localStorage.getItem("ab_wallet_vault");
  const userKeys = localStorage.getItem("ab_wallet_pub_keys");
  const [isLocked, setIsLocked] = useState<"locked" | "unlocked">();

  const isRedirect =
    !Boolean(userKeys) ||
    !Boolean(vault) ||
    !Boolean(balances) ||
    vault === "null" ||
    userKeys === "null";

  useEffect(() => {
    chrome?.storage?.local
      .get(["ab_is_wallet_locked"])
      .then((result) => {
        if (result.ab_is_wallet_locked !== "unlocked") {
          localStorage.setItem("ab_wallet_pub_keys", "");
        }

        setIsLocked(result.ab_is_wallet_locked || "locked");
      })
      .catch(() => {
        setIsLocked("locked");
        localStorage.setItem("ab_wallet_pub_keys", "");
      });
  }, [isLocked]);

  if (chrome?.storage && !isLocked) {
    return <></>;
  }

  chrome?.runtime?.onMessage.addListener((request) => {
    if (request.isLocked === true) {
      chrome?.storage?.local
        .set({ ab_is_wallet_locked: "locked" })
        .then(() => window.close());
    }
  });

  if (isRedirect || (isLocked === "locked" && chrome?.storage)) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <ConnectPopup />
      {children}
    </>
  );
}

export { ProtectedRoute };
