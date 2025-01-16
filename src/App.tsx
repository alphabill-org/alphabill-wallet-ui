import { ReactElement, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { CreateWallet } from "./routes/CreateWallet/CreateWallet";
import { Home } from "./routes/Home";
import { Login } from "./routes/Login/Login";
import { Network } from "./routes/Network";

export function App(): ReactElement {
  const [, setIsNetworkError] = useState<boolean>(false);

  useEffect(() => {
    window.addEventListener("online", () => setIsNetworkError(false));
    window.addEventListener("offline", () => setIsNetworkError(true));

    return (): void => {
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
          <Route path="/create-wallet" element={<CreateWallet />} />
          <Route path="/recover-wallet" element={<CreateWallet isAccountRecovery={true} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </div>
  );
}
