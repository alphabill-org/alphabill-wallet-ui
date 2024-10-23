import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import CreateAccount from "./routes/CreateAccount/CreateAccount";
import Login from "./routes/Login/Login";
import Home from "./routes/Home";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import RecoverAccount from "./routes/RecoverAccount/RecoverAccount";
import Popup from "./components/Popup/Popup";
import Fungible from "./routes/Fungible";
import NFT from "./routes/NFT";
import History from "./routes/History";

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
    const extensionId = chrome?.runtime?.id;
    extensionId &&
      chrome?.runtime?.sendMessage(extensionId, {
        ab_extension_state: { is_popup_open: true },
      });

    return () => {
      extensionId &&
        chrome?.runtime?.sendMessage(extensionId, {
          ab_extension_state: { is_popup_open: false },
        });
    };
  }, []);

  return (
    <div className="app">
      <div className="app__background-top"></div>
      <div className="app__background-bottom"></div>
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
          <Route
            path="/fungible"
            element={
              <ProtectedRoute>
                <Fungible/>
              </ProtectedRoute>
            }          
          />
          <Route
            path="/nft"
            element={
              <ProtectedRoute>
                <NFT/>
              </ProtectedRoute>
            }          
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History/>
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
