import { useState } from "react";
import classNames from "classnames";

import { INavbarViews } from "../../types/Types";
import { useApp } from "../../hooks/appProvider";
import Spinner from "../Spinner/Spinner";
import FungibleAssetsCol from "./assetsCol/FungibleAssetsCol";
import NFTAssetsCol from "./assetsCol/NFTAssetsCol";
import Navbar from "../Navbar/Navbar";
import FeeCredit from "./FeeCredit";

function Dashboard(): JSX.Element | null {
  const { accounts } = useApp();
  const [navbarView, setNavarView] = useState<INavbarViews>("fungible");
  const isHomeView = navbarView === "home";
  if (!accounts) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  return (
    <div
      className={classNames("dashboard", {
        dashboard__home: isHomeView,
      })}
    >
      {isHomeView && <FeeCredit isTitle={isHomeView} />}
      {(navbarView === "fungible" || isHomeView) && (
        <FungibleAssetsCol isTitle={isHomeView} />
      )}

      {(navbarView === "nonFungible" || isHomeView) && (
        <NFTAssetsCol isTitle={isHomeView} />
      )}

      {(navbarView === "history" || isHomeView) && <div></div>}
      <Navbar
        isFees
        activeBar={navbarView}
        onChange={(v: INavbarViews) => setNavarView(v)}
      />
    </div>
  );
}

export default Dashboard;
