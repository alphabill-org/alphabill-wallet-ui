import classNames from "classnames";
import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useQueryClient } from "react-query";

import { IFungibleAsset } from "../../types/Types";
import { ReactComponent as CopyIco } from "../../images/copy-ico.svg";
import { ReactComponent as Sync } from "../../images/sync-ico.svg";
import { ReactComponent as Send } from "../../images/send-ico.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";

import Button from "../Button/Button";
import Spacer from "../Spacer/Spacer";
import { useApp } from "../../hooks/appProvider";
import Spinner from "../Spinner/Spinner";
import { useAuth } from "../../hooks/useAuth";

import { invalidateAllLists } from "../../utils/utils";
import { AlphaType, TransferView } from "../../utils/constants";
import FungibleAssetsCol from "./components/FungibleAssetsCol";
import NFTAssetsCol from "./components/NFTAssetsCol";
import Navbar from "../Navbar/Navbar";
import Popovers from "./components/Popovers";

function Dashboard(): JSX.Element | null {
  const { activeAccountId, activeAsset, setActiveAssetLocal } = useAuth();
  const { setIsActionsViewVisible, setActionsView, account, accounts } =
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

  const [isFungibleActive, setIsFungibleActive] = useState<boolean>(true);
  const [isKeySelectOpen, setIsKeySelectOpen] = useState(false);

  const queryClient = useQueryClient();

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

      <div className="dashboard__account">
        <div
          className="dashboard__account-id"
          onClick={() => setIsKeySelectOpen(!isKeySelectOpen)}
        >
          <span className="dashboard__account-name">{account?.name}</span>
          <span className="dashboard__account-id-item">
            {account?.name && "-"} {account?.pubKey}
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
      <div className="dashboard__buttons">
        <Button
          onClick={() =>
            invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient)
          }
          variant="primary"
        >
          <Sync height="16" width="16" />
          <div className="pad-8-l">Refresh</div>
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setActionsView(TransferView);
            setActiveAssetLocal(
              JSON.stringify(
                account.assets.fungible.find(
                  (asset) => asset.typeId === AlphaType
                )
              )
            );
            setIsActionsViewVisible(true);
            invalidateAllLists(
              activeAccountId,
              activeAsset.typeId,
              queryClient
            );
          }}
        >
          <Send height="16" width="16" />
          <div className="pad-8-l">Transfer</div>
        </Button>
      </div>
      <Spacer mb={32} />
      <div className="dashboard__footer">
        <Navbar
          isFungibleActive={isFungibleActive}
          onChange={(v: boolean) => setIsFungibleActive(v)}
        />
        <div className="dashboard__info">
          {isFungibleActive === true ? <FungibleAssetsCol /> : <NFTAssetsCol />}
        </div>
      </div>
      <Popovers
        isKeySelectOpen={isKeySelectOpen}
        setIsKeySelectOpen={(v) => setIsKeySelectOpen(v)}
      />
    </div>
  );
}

export default Dashboard;
