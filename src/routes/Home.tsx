import { useState } from "react";
import moment from "moment";
import { isObject } from "lodash";

import { IAccount, IActionProps } from "./../types/Types";
import Dashboard from "../components/Dashboard/Dashboard";
import Header from "../components/Header/Header";
import Actions from "../components/Actions/Actions";
import { useAuth } from "../hooks/useAuth";

function Home({
  actionsView,
  setIsActionsViewVisible,
  setActionsView,
  isActionsViewVisible,
}: IActionProps): JSX.Element {
  const { userKeys } = useAuth();
  const accountNames = localStorage.getItem("ab_wallet_account_names") || "";
  const keysArr = userKeys?.split(" ") || [];
  const accountNamesObj =
    accountNames.includes(keysArr[0]) && JSON.parse(accountNames);
  const [accounts, setAccounts] = useState<IAccount[]>(
    keysArr.map((key, idx) => ({
      id: key,
      name: accountNamesObj?.["_" + key] || "",
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
          time: moment().subtract(5, "days").startOf("day").format("ll LTS"),
          address:
            "1693c10bb3be2d5cb4de35bf7e6a0b592f5918038393a0447aef019fca52b37e",
          type: "Send",
          network: "AB Testnet",
        },
      ],
    }))
  );

  const account = accounts?.find(
    (account: IAccount) => account?.isActive === true
  );

  return (
    <>
      <Header
        accounts={accounts || []}
        setAccounts={setAccounts}
        setActionsView={setActionsView}
        setIsActionsViewVisible={setIsActionsViewVisible}
        account={account}
      />
      <Dashboard
        accounts={accounts}
        setAccounts={setAccounts}
        setActionsView={setActionsView}
        setIsActionsViewVisible={setIsActionsViewVisible}
        account={account}
      />
      <Actions
        accounts={accounts}
        setAccounts={setAccounts}
        actionsView={actionsView}
        setActionsView={setActionsView}
        setIsActionsViewVisible={setIsActionsViewVisible}
        isActionsViewVisible={isActionsViewVisible}
      />
    </>
  );
}

export default Home;
