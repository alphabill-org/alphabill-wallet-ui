import { ReactElement } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header/Header";

export default function Home(): ReactElement {
  return (
    <>
      <Header />
      <Outlet />
      <div></div>
      <div></div>
      {/*<Dashboard />*/}
      {/*<Actions />*/}
      {/*<ToolBar />*/}
    </>
  );
}
