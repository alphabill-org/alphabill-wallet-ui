import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import moment from "moment";

import CreateAccount from "./routes/CreateAccount/CreateAccount";
import Animations from "./components/Animations/Animations";

import Login from "./routes/Login/Login";
import { IAccount } from "./types/Types";
import Home from "./routes/Home";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

function App() {
  const [isActionsViewVisible, setIsActionsViewVisible] =
    useState<boolean>(false);
  const { userKeys } = useAuth();
  const [actionsView, setActionsView] = useState("Buy");
  const accountNames = localStorage.getItem('ab_wallet_account_names')?.split(",");

  const [accounts, setAccounts] = useState<IAccount[]>(
    userKeys
      ? userKeys.split(" ").map((key, idx) => ({
          id: key,
          name: accountNames ? accountNames[idx] : 'Account ' + idx + 1,
          isActive: true,
          assets: [
            {
              id: "AB",
              name: "AlphaBill Token",
              network: "AB Testnet",
              amount: 1000,
            },
          ],
          activeNetwork: "AB Testnet",
          networks: [
            /*{
              id: "AB Mainnet",
              isTestNetwork: false,
            },*/
            {
              id: "AB Testnet",
              isTestNetwork: true,
            },
          ],
          activities: [
            {
              id: "AB",
              name: "AlphaBill Token",
              amount: 300,
              time: moment()
                .subtract(5, "days")
                .startOf("day")
                .format("ll LTS"),
              address:
                "1693c10bb3be2d5cb4de35bf7e6a0b592f5918038393a0447aef019fca52b37e",
              type: "Send",
              network: "AB Testnet",
            },
          ],
        }))
      : []
  );

  const account = accounts?.find((account) => account?.isActive === true);

  return (
    <div className="app">
      <Animations />
      <div className="app__content">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home
                  account={account}
                  accounts={accounts}
                  setAccounts={setAccounts}
                  actionsView={actionsView}
                  setActionsView={setActionsView}
                  setIsActionsViewVisible={setIsActionsViewVisible}
                  isActionsViewVisible={isActionsViewVisible}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/create-wallet" element={<CreateAccount />} />
          <Route path="/recover-wallet" element={<CreateAccount />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
