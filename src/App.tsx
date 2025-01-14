import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import {
  CreateAccountKeyPage,
  CreateAccountMnemonicPage,
  CreateAccountPasswordPage
} from "./routes/CreateAccount/CreateAccount";
import { Home } from "./routes/Home";
import { Network } from "./routes/Network";

export function App() {
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false);

  useEffect(() => {
    window.addEventListener("online", () => setIsNetworkError(false));
    window.addEventListener("offline", () => setIsNetworkError(true));

    return () => {
      window.removeEventListener("online", () => setIsNetworkError(false));
      window.removeEventListener("offline", () => setIsNetworkError(true));
    };
  }, []);

  return (
    <div className="app">
      <div className="app__background-top"></div>
      <div className="app__background-bottom"></div>
      <div className="app__content">
        <Routes>
          <Route path="/" element={<Home />}>
            <Route path="network" element={<Network />} />
          </Route>
          <Route path="/create-wallet" element={<CreateAccountPasswordPage />} />
          <Route path="/create-wallet/step-2" element={<CreateAccountMnemonicPage />} />
          <Route path="/create-wallet/step-3" element={<CreateAccountKeyPage />} />
        </Routes>
      </div>
    </div>
  );
}
