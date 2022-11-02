import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import CreateAccount from "./routes/CreateAccount/CreateAccount";
import Animations from "./components/Animations/Animations";
import Login from "./routes/Login/Login";
import Home from "./routes/Home";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import RecoverAccount from "./routes/RecoverAccount/RecoverAccount";
import { useAuth } from "./hooks/useAuth";
import { useApp } from "./hooks/appProvider";
import { useEffect } from "react";

function App() {
  const [isActionsViewVisible, setIsActionsViewVisible] =
    useState<boolean>(false);
  const [actionsView, setActionsView] = useState("Buy");

  return (
    <div className="app">
      <Animations />
      <div className="app__content">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home
                  actionsView={actionsView}
                  setActionsView={setActionsView}
                  setIsActionsViewVisible={setIsActionsViewVisible}
                  isActionsViewVisible={isActionsViewVisible}
                />
              </ProtectedRoute>
            }
          />
          {<Route path="/login" element={<Login />} />}
          <Route path="/create-wallet" element={<CreateAccount />} />
          <Route path="/recover-wallet" element={<RecoverAccount />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
