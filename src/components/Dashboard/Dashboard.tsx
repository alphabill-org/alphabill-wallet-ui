import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useQueryClient } from "react-query";
import { Tooltip } from "react-tooltip";

import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import Arrow from "../../images/arrow.svg?react";
import CopyIco from "../../images/copy-ico.svg?react";
import Send from "../../images/send-ico.svg?react";
import Sync from "../../images/sync-ico.svg?react";
import { IFungibleAsset, INavbarViews } from "../../types/Types";

import { AlphaType, TransferFungibleView } from "../../utils/constants";
import { invalidateAllLists } from "../../utils/utils";
import Button from "../Button/Button";
import FeeCreditSection from "../FeeCredit/FeeCreditSection";
import Navbar from "../Navbar/Navbar";
import Spacer from "../Spacer/Spacer";
import Spinner from "../Spinner/Spinner";

import FungibleAssetsCol from "./assetsCol/FungibleAssetsCol";
import NFTAssetsCol from "./assetsCol/NFTAssetsCol";
import FeeCredit from "./FeeCredit";
import Popovers from "./Popovers";

function Dashboard(): JSX.Element | null {
  const { activeAccountId, activeAsset, setActiveAssetLocal } = useAuth();
  const { setIsActionsViewVisible, setActionsView, account, accounts } = useApp();
  const balance: string =
    account?.assets?.fungible?.find((asset: IFungibleAsset) => asset.typeId === AlphaType)?.UIAmount || "";

  const balanceSizeClass = Number(balance?.length) > 7 ? (balance?.length > 12 ? "x-small" : "small") : "";

  const [navbarView, setNavarView] = useState<INavbarViews>("fungible");
  const [isKeySelectOpen, setIsKeySelectOpen] = useState(false);
  const keyNameRef = useRef<HTMLSpanElement>(null);
  const [keyNameWidth, setKeyNameWidth] = useState(0);

  const queryClient = useQueryClient();

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
      <FeeCreditSection />
      <Spacer mb={48} />
      <div className="dashboard__balance">
        <div className={classNames("dashboard__balance-amount", balanceSizeClass)}>{balance || "0"}</div>
        <div className={classNames("dashboard__balance-id t-ellipsis", balanceSizeClass)}>{AlphaType}</div>
      </div>
      <Spacer mb={32} />

      <div className="dashboard__account" id={"account-id-" + account?.pubKey}>
        <div className="dashboard__account-id" onClick={() => setIsKeySelectOpen(!isKeySelectOpen)}>
          <span className="dashboard__account-name" ref={keyNameRef}>
            {account?.name}
          </span>
          <Arrow />
        </div>
        <div className="dashboard__account-buttons">
          <CopyToClipboard text={account?.pubKey || ""}>
            <Button id="copy-tooltip" tooltipContent="Key copied" variant="icon" className="copy-btn">
              <CopyIco className="textfield__btn" height="12px" />
            </Button>
          </CopyToClipboard>
        </div>
      </div>
      <Spacer mb={8} />
      <div className="dashboard__buttons">
        <Button onClick={() => invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient)} variant="primary">
          <Sync height="16" width="16" />
          <div className="pad-8-l">Refresh</div>
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setActionsView(TransferFungibleView);
            setActiveAssetLocal(JSON.stringify(account?.assets?.fungible.find((asset) => asset.typeId === AlphaType)));
            setIsActionsViewVisible(true);
            invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
          }}
        >
          <Send height="16" width="16" />
          <div className="pad-8-l">Transfer</div>
        </Button>
      </div>
      <Spacer mb={32} />
      <div className="dashboard__footer">
        <Navbar isFees activeBar={navbarView} onChange={(v: INavbarViews) => setNavarView(v)} />
        <div className="dashboard__info">
          {navbarView === "fungible" ? (
            <FungibleAssetsCol />
          ) : navbarView === "nonFungible" ? (
            <NFTAssetsCol />
          ) : (
            <FeeCredit />
          )}
        </div>
      </div>
      <Popovers isKeySelectOpen={isKeySelectOpen} setIsKeySelectOpen={(v) => setIsKeySelectOpen(v)} />
    </div>
  );
}

export default Dashboard;
