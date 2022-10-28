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
  const [accounts, setAccounts] = useState<IAccount[]>([]);

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
          <CreateAccount
            setIsLoggedIn={setIsLoggedIn}
            setIsCreateAccountView={setIsCreateAccountView}
          />
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
