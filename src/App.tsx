import { Routes, Route, Navigate } from "react-router-dom";

import CreateAccount from "./routes/CreateAccount/CreateAccount";
import Animations from "./components/Animations/Animations";
import Login from "./routes/Login/Login";
import Home from "./routes/Home";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import RecoverAccount from "./routes/RecoverAccount/RecoverAccount";
import { useEffect } from "react";
import Connect from "./routes/Connect";

function App() {
  useEffect(() => {
    chrome?.runtime?.sendMessage({ handleOpenState: { isPopupOpen: true } });

    return () => {
      chrome?.runtime?.sendMessage({ handleOpenState: { isPopupOpen: false } });
    };
  }, []);

  return (
    <div className="app">
      <Animations />
      <div className="app__content">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          {<Route path="/connect" element={<Connect />} />}
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
