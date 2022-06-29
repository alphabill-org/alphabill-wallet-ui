import React from "react";
import Animations from "./components/Animations/Animations";

import Login from "./components/Login/Login";

function App() {
  return (
    <div className="app">
      <Animations />
      <div className="app__content">
        <Login />
      </div>
    </div>
  );
}

export default App;
