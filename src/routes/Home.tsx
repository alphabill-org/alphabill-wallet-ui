import { ReactElement, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer/Footer";
import { Header } from "../components/Header/Header";
import { useAuthentication } from "../hooks/authentication";

export function Home(): ReactElement {
  const { isLoggedIn } = useAuthentication();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { replace: true });
    }
  }, [isLoggedIn]);

  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
