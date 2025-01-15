import { ReactElement, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Header } from "../components/Header/Header";
import { useVault } from "../hooks/vault";

export function Home(): ReactElement {
  const vault = useVault();
  const navigate = useNavigate();

  useEffect(() => {
    if (!vault.keys.length) {
      navigate("/login");
    }
  }, [vault.keys]);

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
