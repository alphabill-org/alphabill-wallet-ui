import classNames from "classnames";
import { useState } from "react";

import { IFungibleAsset, INavbarViews } from "../../types/Types";

import Spacer from "../Spacer/Spacer";
import { useApp } from "../../hooks/appProvider";
import Spinner from "../Spinner/Spinner";

import { AlphaType } from "../../utils/constants";
import FungibleAssetsCol from "./assetsCol/FungibleAssetsCol";
import NFTAssetsCol from "./assetsCol/NFTAssetsCol";
import Navbar from "../Navbar/Navbar";
import FeeCredit from "./FeeCredit";

function Dashboard(): JSX.Element | null {
  const { accounts } = useApp();
  const [navbarView, setNavarView] = useState<INavbarViews>("fungible");

  if (!accounts) {
    return (
      <div className="m-auto">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Spacer mb={48} />
      <div className="dashboard__footer">
        <div className="dashboard__info">
          {navbarView === "fungible" ? (
            <FungibleAssetsCol />
          ) : navbarView === "nonFungible" ? (
            <NFTAssetsCol />
          ) : (
            <FeeCredit />
          )}
        </div>
        <Navbar
          isFees
          activeBar={navbarView}
          onChange={(v: INavbarViews) => setNavarView(v)}
        />
      </div>
    </div>
  );
}

export default Dashboard;
