import { useEffect } from "react";
import { useQueryClient } from "react-query";

import Dashboard from "../components/Dashboard/Dashboard";
import Header from "../components/Header/Header";
import Actions from "../components/Actions/Actions";
import { useAuth } from "../hooks/useAuth";
import { useApp } from "../hooks/appProvider";
import { IAccount } from "../types/Types";

function Home(): JSX.Element {
  const queryClient = useQueryClient();
  const { accounts, activeAccountId } = useApp();
  const account = accounts?.find(
    (account: IAccount) => account?.pubKey === activeAccountId
  );

  useEffect(() => {
    account && queryClient.invalidateQueries(["balance", account?.pubKey]);
  }, [accounts, account, queryClient]);

  return (
    <>
      <Header />
      <Dashboard />
      <Actions />
    </>
  );
}

export default Home;
