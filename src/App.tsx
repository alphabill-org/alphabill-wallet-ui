import { Navigate, Route, Routes } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";

import CreateAccount from "./routes/CreateAccount/CreateAccount";
import Animations from "./components/Animations/Animations";
import Login from "./routes/Login/Login";
import Home from "./routes/Home";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import RecoverAccount from "./routes/RecoverAccount/RecoverAccount";
import Popup from "./components/Popup/Popup";
import { RuntimeEnvironmentContext } from "./index";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import Dashboard from "./components/Dashboard/Dashboard";
import Profile from "./actionViews/Profile";

export class PublicKey {
  private readonly hex: string;

  constructor(public readonly bytes: Uint8Array) {
    this.hex = Base16Converter.encode(bytes);
  }

  public toString() {
    return this.hex;
  }
}

function App() {
  const runtimeEnvironment = useContext(RuntimeEnvironmentContext);
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false);

  useEffect(() => {
    const onlineListener = () => setIsNetworkError(false);
    const offlineListener = () => setIsNetworkError(true);
    window.addEventListener("online", onlineListener);
    window.addEventListener("offline", offlineListener);

    return () => {
      window.removeEventListener("online", onlineListener);
      window.removeEventListener("offline", offlineListener);
    };
  }, []);

  useEffect(() => {
    runtimeEnvironment?.runtime.sendMessage(
      runtimeEnvironment?.runtime.id,
      {
        ab_extension_state: { is_popup_open: true }
      });

    return () => {
      runtimeEnvironment?.runtime.sendMessage(
        runtimeEnvironment?.runtime.id,
        {
          ab_extension_state: { is_popup_open: false }
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
            element={<ProtectedRoute><Home><Dashboard /></Home></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile />tere</ProtectedRoute>}
          />
          <Route path="/login" element={<Login />} />
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
