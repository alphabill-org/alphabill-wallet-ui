import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import CreateAccount from "./routes/CreateAccount/CreateAccount";
import Animations from "./components/Animations/Animations";
import Login from "./routes/Login/Login";
import Home from "./routes/Home";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import RecoverAccount from "./routes/RecoverAccount/RecoverAccount";
import Popup from "./components/Popup/Popup";

function App() {
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false);

  useEffect(() => {
    window.addEventListener("online", () => setIsNetworkError(false));
    window.addEventListener("offline", () => setIsNetworkError(true));

    return () => {
      window.removeEventListener("online", () => setIsNetworkError(false));
      window.removeEventListener("offline", () => setIsNetworkError(true));
    };
  }, []);

  useEffect(() => {
    chrome?.runtime?.sendMessage({
      ab_extension_state: { is_popup_open: true },
    });

    return () => {
      chrome?.runtime?.sendMessage({
        ab_extension_state: { is_popup_open: false },
      });
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
          {<Route path="/login" element={<Login />} />}
          <Route path="/create-wallet" element={<CreateAccount />} />
          <Route path="/recover-wallet" element={<RecoverAccount />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Popup isPopupVisible={isNetworkError} title="No internet connection!">
          <div className="pad-24-t w-100p">
            <p>
              There is something wrong with your internet connection. Please
              reconnect and try again.
            </p>
          </div>
        </Popup>
      </div>
    </div>
  );
}

export default App;
