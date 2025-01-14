import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import {
  CreateWallet
} from "./routes/CreateWallet/CreateWallet";
import { Home } from "./routes/Home";
import { Network } from "./routes/Network";
import { Step1 } from "./routes/CreateWallet/Step1";
import { Step2 } from "./routes/CreateWallet/Step2";
import { Step3 } from "./routes/CreateWallet/Step3";

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
          <Route path="/create-wallet" element={<CreateWallet />}>
            <Route path="step-1" element={<Step1 />} />
            <Route path="step-2" element={<Step2 />} />
            <Route path="step-3" element={<Step3 />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}
