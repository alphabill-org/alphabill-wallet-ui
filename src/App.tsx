import moment from "moment";
import { useState } from "react";

import CreateAccount from "./components/CreateAccount/CreateAccount";
import Actions from "./components/Actions/Actions";
import Animations from "./components/Animations/Animations";
import Dashboard from "./components/Dashboard/Dashboard";
import Header from "./components/Header/Header";
import Login from "./components/Login/Login";
import { IAccount } from "./types/Types";

function App() {
  const [isActionsViewVisible, setIsActionsViewVisible] =
    useState<boolean>(false);
  const [isCreateAccountView, setIsCreateAccountView] =
    useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [actionsView, setActionsView] = useState("Buy");
  const [accounts, setAccounts] = useState<IAccount[]>([
    /*{
      id: "3f75cb8f3e692ac2e9a43bdb3d04d1bf8551b3190768f46dcfa379029a8686dd",
      name: "Account 1",
      isActive: false,
      assets: [
        {
          id: "AB",
          name: "AlphaBill Token",
          network: "AB Mainnet",
          amount: 1300,
        },
        {
          id: "AB",
          name: "AlphaBill Token",
          network: "AB Testnet",
          amount: 1000,
        },
        {
          id: "ETH",
          name: "Ethereum Token",
          network: "AB Mainnet",
          amount: 500,
        },
      ],
      activeNetwork: "AB Mainnet",
      networks: [
        {
          id: "AB Mainnet",
          isTestNetwork: false,
        },
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
          time: moment().subtract(2, "days").startOf("day").format("ll LTS"),
          address:
            "1693c10bb3be2d5cb4de35bf7e6a0b592f5918038393a0447aef019fca52b37e",
          type: "Buy",
          network: "AB Mainnet",
        },
        {
          id: "AB",
          name: "AlphaBill Token",
          amount: 300,
          time: moment().subtract(6, "days").startOf("day").format("ll LTS"),
          address:
            "1693c10bb3be2d5cb4de35bf7e6a0b592f5918038393a0447aef019fca52b37e",
          type: "Send",
          network: "AB Mainnet",
          fromAddress:
            "3f75cb8f3e692ac2e9a43bdb3d04d1bf8551b3190768f46dcfa379029a8686dd",
        },
        {
          id: "AB",
          name: "AlphaBill Token",
          amount: 300,
          time: moment().subtract(5, "days").startOf("day").format("ll LTS"),
          address:
            "1693c10bb3be2d5cb4de35bf7e6a0b592f5918038393a0447aef019fca52b37e",
          type: "Send",
          network: "AB Testnet",
        },
        {
          id: "ETH",
          name: "Ethereum Token",
          amount: 495,
          time: moment().subtract(4, "days").startOf("day").format("ll LTS"),
          address:
            "1693c10bb3be2d5cb4de35bf7e6a0b592f5918038393a0447aef019fca52b37e",
          type: "Swap",
          network: "AB Mainnet",
          fromID: "AB",
          fromAmount: 500,
        },
      ],
    },*/
  ]);

  return (
    <div className="app">
      <Animations />
      <div className="app__content">
        {isLoggedIn ? (
          <>
            <Header
              accounts={accounts}
              setAccounts={setAccounts}
              setActionsView={setActionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
            />
            <Dashboard
              accounts={accounts}
              setAccounts={setAccounts}
              setActionsView={setActionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
            />
            <Actions
              accounts={accounts}
              setAccounts={setAccounts}
              actionsView={actionsView}
              setActionsView={setActionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
              isActionsViewVisible={isActionsViewVisible}
              setIsLoggedIn={setIsLoggedIn}
            />
          </>
        ) : isCreateAccountView ? (
          <CreateAccount setIsLoggedIn={setIsLoggedIn} setIsCreateAccountView={setIsCreateAccountView} />
        ) : (
          <Login
            setIsLoggedIn={setIsLoggedIn}
            setIsCreateAccountView={setIsCreateAccountView}
          />
        )}
      </div>
    </div>
  );
}

export default App;
