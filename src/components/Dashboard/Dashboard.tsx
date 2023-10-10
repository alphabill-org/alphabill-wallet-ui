import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Tooltip } from "react-tooltip";

import { IFungibleAsset, INavbarViews } from "../../types/Types";
import { ReactComponent as CopyIco } from "../../images/copy-ico.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { useApp } from "../../hooks/appProvider";
import Spinner from "../Spinner/Spinner";
import { useAuth } from "../../hooks/useAuth";

import { AlphaType } from "../../utils/constants";
import FungibleAssetsCol from "./assetsCol/FungibleAssetsCol";
import NFTAssetsCol from "./assetsCol/NFTAssetsCol";
import Navbar from "../Navbar/Navbar";
import Popovers from "./Popovers";
import FeeCredit from "./FeeCredit";
import {
  tooltipHideDelay,
  tooltipOffset,
  tooltipShowDelay,
} from "../../test/constants";

function Dashboard(): JSX.Element | null {
  const { activeAccountId } = useAuth();
  const { account, accounts } =
    useApp();
  const balance: string =
    account?.assets?.fungible?.find(
      (asset: IFungibleAsset) => asset.typeId === AlphaType
    )?.UIAmount || "";

  const balanceSizeClass =
    Number(balance?.length) > 7
      ? balance?.length > 12
        ? "x-small"
        : "small"
      : "";

  const [navbarView, setNavarView] = useState<INavbarViews>("fungible");
  const [isKeySelectOpen, setIsKeySelectOpen] = useState(false);
  const keyNameRef = useRef<HTMLSpanElement>(null);
  const [keyNameWidth, setKeyNameWidth] = useState(0);

  useEffect(() => {
    keyNameRef.current && setKeyNameWidth(keyNameRef.current.offsetWidth);
  }, [account?.name, activeAccountId]);

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
      <div className="dashboard__balance">
        <div
          className={classNames("dashboard__balance-amount", balanceSizeClass)}
        >
          {balance || "0"}
        </div>
        <div
          className={classNames(
            "dashboard__balance-id t-ellipsis",
            balanceSizeClass
          )}
        >
          {AlphaType}
        </div>
      </div>
      <Spacer mb={32} />

      <div className="dashboard__account" id={"account-id-" + account?.pubKey}>
        <Tooltip
          anchorId={"account-id-" + account?.pubKey}
          content={account?.pubKey}
          offset={tooltipOffset}
          clickable
          delayHide={tooltipHideDelay}
          delayShow={tooltipShowDelay}
        />
        <div
          className="dashboard__account-id"
          onClick={() => setIsKeySelectOpen(!isKeySelectOpen)}
        >
          <span className="dashboard__account-name" ref={keyNameRef}>
            {account?.name}
          </span>
          <span className="dashboard__account-id-hover"></span>
          <span
            className="dashboard__account-id-item"
            style={{
              maxWidth: 212 - keyNameWidth,
              display: keyNameWidth > 102 ? "block" : "flex",
            }}
          >
            {account?.name && "- "}
            {keyNameWidth > 102 ? (
              account?.pubKey
            ) : (
              <>
                <span className="t-ellipsis" style={{ minWidth: 64 }}>
                  {account?.pubKey}
                </span>
                <span>
                  {account?.pubKey.substr(
                    account?.pubKey.length - 6,
                    account?.pubKey.length
                  )}
                </span>
              </>
            )}
          </span>
          <Arrow />
        </div>
        <div className="dashboard__account-buttons">
          <CopyToClipboard text={account?.pubKey || ""}>
            <Button
              id="copy-tooltip"
              tooltipContent="Key copied"
              variant="icon"
              className="copy-btn"
            >
              <CopyIco className="textfield__btn" height="12px" />
            </Button>
          </CopyToClipboard>
        </div>
      </div>
      <Spacer mb={8} />
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
      <Popovers
        isKeySelectOpen={isKeySelectOpen}
        setIsKeySelectOpen={(v) => setIsKeySelectOpen(v)}
      />
    </div>
  );
}

export default Dashboard;
