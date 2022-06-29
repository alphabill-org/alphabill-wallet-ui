import { useState } from "react";
import Animations from "./components/Animations/Animations";
import Login from "./components/Login/Login";
import { IAccount, IActivity, IAsset, INetwork } from "./types/Types";

function App() {
  const [networks, setNetworks] = useState<INetwork[]>([
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
  ]);

  const [accounts, setAccounts] = useState<IAccount[]>([
    {
      id: "alphabill",
      address: "0x68ab2...4ff2408",
      assets: [
        {
          id: "alphabill",
          amount: 300,
        },
      ],
    },
  ]);

  const [assets, setAssets] = useState<IAsset[]>([
    {
      id: "alphabill",
      amount: 300,
    },
  ]);

  const [activities, setActivities] = useState<IActivity[]>([
    {
      id: "alphabill",
      amount: 300,
      date: new Date(),
      address: "0x68ab2...4ff2408",
      type: "Buy",
    },
  ]);

  return (
    <div className="app">
      <Animations />
      <div className="app__content">
        <Login />
      </div>
    </div>
  );
}

export default App;
