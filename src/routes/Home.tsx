import { IActionProps } from "./../types/Types";
import Dashboard from "../components/Dashboard/Dashboard";
import Header from "../components/Header/Header";
import Actions from "../components/Actions/Actions";

function Home({
  actionsView,
  setIsActionsViewVisible,
  setActionsView,
  isActionsViewVisible,
  accounts,
  setAccounts,
  account
}: IActionProps): JSX.Element {
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
