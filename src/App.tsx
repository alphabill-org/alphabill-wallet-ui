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
      id: "0xb794f5ea0ba39494ce839613fffba74279579268",
      name: "Account 1",
      isActive: false,
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
          time: moment().subtract(2, "days").startOf("day").format("LLL"),
          address: "0xb666f5ea0ba39494ce839613fffba74279579268",
          type: "Buy",
          network: "AB Mainnet",
        },
        {
          id: "AB",
          name: "AlphaBill Token",
          amount: 300,
          time: moment().subtract(6, "days").startOf("day").format("LLL"),
          address: "0xb666f5ea0ba39494ce839613fffba74279579268",
          type: "Send",
          network: "AB Mainnet",
        },
        {
          id: "AB",
          name: "AlphaBill Token",
          amount: 300,
          time: moment().subtract(5, "days").startOf("day").format("LLL"),
          address: "0xb666f5ea0ba39494ce839613fffba74279579268",
          type: "Send",
          network: "AB Testnet",
        },
        {
          id: "AB",
          name: "AlphaBill Token",
          amount: 300,
          time: moment().subtract(4, "days").startOf("day").format("LLL"),
          address: "0xb666f5ea0ba39494ce839613fffba74279579268",
          type: "Swap",
          network: "AB Mainnet",
        },
      ],
    },
    {
      id: "0xb666f5ea0ba39494ce839613fffba74279579268",
      name: "Account 2",
      isActive: false,
      assets: [
        {
          id: "AB",
          name: "AlphaBill Token",
          amount: 100,
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
          amount: 200,
          time: moment().subtract(2, "days").startOf("day").format("LLL"),
          address: "0xb794f5ea0ba39494ce839613fffba74279579268",
          type: "Buy",
          network: "AB Mainnet",
        },
        {
          id: "AB",
          name: "AlphaBill Token",
          amount: 100,
          time: moment().subtract(6, "days").startOf("day").format("LLL"),
          address: "0xb794f5ea0ba39494ce839613fffba74279579268",
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
              setActionsView={setActionsView}
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
