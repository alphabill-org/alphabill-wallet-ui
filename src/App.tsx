import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./routes/Home";

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

  return (
    <div className="app">
      <div className="app__background-top"></div>
      <div className="app__background-bottom"></div>
      <div className="app__content">
        <Routes>
          <Route path="/" element={<Home />} />
          {/*<Route*/}
          {/*  path="/fungible"*/}
          {/*  element={*/}
          {/*    <ProtectedRoute>*/}
          {/*      <div>Fungible</div>*/}
          {/*    </ProtectedRoute>*/}
          {/*  }*/}
          {/*/>*/}
          {/*<Route*/}
          {/*  path="/nft"*/}
          {/*  element={*/}
          {/*    <ProtectedRoute>*/}
          {/*      <div>NFT</div>*/}
          {/*    </ProtectedRoute>*/}
          {/*  }*/}
          {/*/>*/}
          {/*<Route*/}
          {/*  path="/history"*/}
          {/*  element={*/}
          {/*    <ProtectedRoute>*/}
          {/*      <div>History</div>;*/}
          {/*    </ProtectedRoute>*/}
          {/*  }*/}
          {/*/>*/}
          {/*{<Route path="/login" element={<Login />} />}*/}
          {/*<Route path="/create-wallet" element={<CreateAccount />} />*/}
          {/*<Route path="/recover-wallet" element={<RecoverAccount />} />*/}
          {/*<Route path="*" element={<Navigate to="/" replace />} />*/}
        </Routes>
        {/*<Popup isPopupVisible={isNetworkError} title="No internet connection!">*/}
        {/*  <div className="pad-24-t w-100p">*/}
        {/*    <p>There is something wrong with your internet connection. Please reconnect and try again.</p>*/}
        {/*  </div>*/}
        {/*</Popup>*/}
      </div>
    </div>
  );
}

export default App;
