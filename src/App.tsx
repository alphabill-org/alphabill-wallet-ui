import { useState } from "react";
import Animations from "./components/Animations/Animations";
import Header from "./components/Header/Header";
import Login from "./components/Login/Login";
import { IAccount } from "./types/Types";

function App() {
  const [accounts, setAccounts] = useState<IAccount[]>([
    {
      id: "0x68ab2...4ff2408",
      isLoggedIn: false,
      assets: [
        {
          id: "alphabill",
          amount: 300,
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
          date: new Date(),
          address: "0x68ab2...4ff2408",
          type: "Buy",
          network: "AB Mainnet",
        },
        {
          id: "alphabill",
          amount: 300,
          date: new Date(),
          address: "0x68ab2...4ff2408",
          type: "Send",
          network: "AB Mainnet",
        },
        {
          id: "alphabill",
          amount: 300,
          date: new Date(),
          address: "0x68ab2...4ff2408",
          type: "Send",
          network: "AB Testnet",
        },
        {
          id: "alphabill",
          amount: 300,
          date: new Date(),
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
            <Header accounts={accounts} account={account} setAccounts={setAccounts} />
          </>
        ) : (
          <Login accounts={accounts} setAccounts={setAccounts} />
        )}
      </div>
    </div>
  );
}

export default App;
