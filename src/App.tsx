import moment from "moment";
import { useState } from "react";
import Actions from "./components/Actions/Actions";
import Animations from "./components/Animations/Animations";
import Dashboard from "./components/Dashboard/Dashboard";
import Header from "./components/Header/Header";
import Login from "./components/Login/Login";
import { IAccount } from "./types/Types";

function App() {
  const [isActionsViewVisible, setIsActionsViewVisible] =
    useState<boolean>(false);
  const [actionsView, setActionsView] = useState("Buy");
  const [accounts, setAccounts] = useState<IAccount[]>([
    {
      id: "0x68ab2...4ff2408",
      isLoggedIn: false,
      balance: 300,
      assets: [
        {
          id: "AB",
          name: "AlphaBill Token",
          amount: 1300,
        },
        {
          id: "ETH",
          name: "Etherium Token",
          amount: 100,
        },
      ],
      networks: [
        {
          id: "AB Mainnet",
          isActive: true,
          isTestNetwork: false,
        },
        {
          id: "AB Testnet",
          isActive: false,
          isTestNetwork: true,
        },
      ],
      activities: [
        {
          id: "alphabill",
          amount: 300,
          time: moment().subtract(2, "days").startOf("day").format("LLL"),
          address: "0x68ab2...4ff2408",
          type: "Buy",
          network: "AB Mainnet",
        },
        {
          id: "alphabill",
          amount: 300,
          time: moment().subtract(6, "days").startOf("day").format("LLL"),
          address: "0x68ab2...4ff2408",
          type: "Send",
          network: "AB Mainnet",
        },
        {
          id: "alphabill",
          amount: 300,
          time: moment().subtract(5, "days").startOf("day").format("LLL"),
          address: "0x68ab2...4ff2408",
          type: "Send",
          network: "AB Testnet",
        },
        {
          id: "alphabill",
          amount: 300,
          time: moment().subtract(4, "days").startOf("day").format("LLL"),
          address: "0x68ab2...4ff2408",
          type: "Swap",
          network: "AB Mainnet",
        },
      ],
    },
  ]);

  const account = accounts?.find((account) => account.isLoggedIn === true);

  return (
    <div className="app">
      <Animations />
      <div className="app__content">
        {account ? (
          <>
            <Header
              accounts={accounts}
              account={account}
              setAccounts={setAccounts}
            />
            <Dashboard
              account={account}
              setActionsView={setActionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
            />
            <Actions
              actionsView={actionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
              isActionsViewVisible={isActionsViewVisible}
            />
          </>
        ) : (
          <Login accounts={accounts} setAccounts={setAccounts} />
        )}
      </div>
    </div>
  );
}

export default App;
