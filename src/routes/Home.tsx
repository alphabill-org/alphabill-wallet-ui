import { useQueryClient } from "react-query";

import Dashboard from "../components/Dashboard/Dashboard";
import Header from "../components/Header/Header";
import Actions from "../components/Actions/Actions";
import { useApp } from "../hooks/appProvider";

function Home(): JSX.Element {
  const queryClient = useQueryClient();
  const { accounts, activeAccountId } = useApp();

  return (
    <>
      <Header />
      <Dashboard />
      <Actions />
    </>
  );
}

export default Home;
