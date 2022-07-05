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
      name: "Account 1",
      isActive: false,
      balance: 1300,
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
    {
      id: "0x68ab1...4ff3333",
      name: "Account 2",
      isActive: false,
      balance: 100,
      assets: [
        {
          id: "AB",
          name: "AlphaBill Token",
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
          amount: 200,
          time: moment().subtract(2, "days").startOf("day").format("LLL"),
          address: "0x68ab2...4ff2408",
          type: "Buy",
          network: "AB Mainnet",
        },
        {
          id: "alphabill",
          amount: 100,
          time: moment().subtract(6, "days").startOf("day").format("LLL"),
          address: "0x68ab2...4ff2408",
          type: "Send",
          network: "AB Mainnet",
        },
      ],
    },
  ]);

  const account = accounts?.find((account) => account.isActive === true);

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
              setActionsView={setActionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
            />
            <Dashboard
              account={account}
              setActionsView={setActionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
            />
            <Actions
              accounts={accounts}
              account={account}
              setAccounts={setAccounts}
              actionsView={actionsView}
              setIsActionsViewVisible={setIsActionsViewVisible}
              isActionsViewVisible={isActionsViewVisible}
            />
          </>
        ) : (
          <Login
            setActionsView={setActionsView}
            setIsActionsViewVisible={setIsActionsViewVisible}
            accounts={accounts}
            setAccounts={setAccounts}
          />
        )}
      </div>
    </div>
  );
}

export default App;
