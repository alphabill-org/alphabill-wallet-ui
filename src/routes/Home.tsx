import React, { ReactElement } from "react";
import Header, { useApp } from "../components/Header/Header";
import Dashboard from "../components/Dashboard/Dashboard";
import { ProtectedRoute } from "./ProtectedRoute";

function Home({children}: {children: ReactElement}): ReactElement {
  const {
    actionsView,
  } = useApp();

  return (
    <ProtectedRoute>
      <Header />
      <Dashboard />
      { /* <Actions title={ActionViewTitle.get(actionsView as ActionView) || ''}/> */ }
    </ProtectedRoute>
  );
}

export default Home;
