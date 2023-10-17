import classNames from "classnames";
import { useQueryClient } from "react-query";
import { useApp } from "../../hooks/appProvider";
import { useAuth } from "../../hooks/useAuth";
import { INavbarViews } from "../../types/Types";
import { AlphaType, TransferFungibleView } from "../../utils/constants";
import { invalidateAllLists } from "../../utils/utils";
import Button from "../Button/Button";

import { ReactComponent as FungibleIco } from "../../images/fungible-ico.svg";
import { ReactComponent as NonFungibleIco } from "../../images/non-fungible-ico.svg";
import { ReactComponent as HistoryIco } from "../../images/history-ico.svg";
import { ReactComponent as HomeIco } from "../../images/home-ico.svg";
import { ReactComponent as Send } from "../../images/send-ico.svg";

export interface INavbarProps {
  onChange: (v: INavbarViews) => void;
  activeBar: INavbarViews;
  isFees?: boolean;
}

export default function Navbar({
  onChange,
  activeBar,
  isFees,
}: INavbarProps): JSX.Element | null {
  const { activeAsset, activeAccountId, setActiveAssetLocal } = useAuth();
  const { account, setIsActionsViewVisible, setActionsView } = useApp();
  const queryClient = useQueryClient();

  const handleChange = (v: INavbarViews) => {
    onChange(v);
    invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
  };

  return (
    <div className="navbar">
      <div
        onClick={() => {
          invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
          handleChange("home");
        }}
        className={classNames("navbar-item", {
          active: activeBar === "home",
        })}
      >
        <HomeIco height="24" width="24" />
        <span>Home</span>
      </div>
      <div
        onClick={() => {
          handleChange("fungible");
        }}
        className={classNames("navbar-item", {
          active: activeBar === "fungible",
        })}
      >
        <FungibleIco />
        <span>Fungible</span>
      </div>
      <Button
        variant="primary"
        onClick={() => {
          setActionsView(TransferFungibleView);
          setActiveAssetLocal(
            JSON.stringify(
              account?.assets?.fungible.find(
                (asset) => asset.typeId === AlphaType
              )
            )
          );
          setIsActionsViewVisible(true);
          invalidateAllLists(activeAccountId, activeAsset.typeId, queryClient);
        }}
      >
        <Send height="20" width="20" />
      </Button>
      <div
        onClick={() => {
          handleChange("nonFungible");
        }}
        className={classNames("navbar-item", {
          active: activeBar === "nonFungible",
        })}
      >
        <NonFungibleIco />
        <span>Non fungible</span>
      </div>
      {isFees && (
        <div
          onClick={() => {
            const alphaAsset = account?.assets?.fungible
              ?.filter((asset) => account?.activeNetwork === asset.network)
              ?.find((asset) => asset.typeId === AlphaType)!;
            setActiveAssetLocal(JSON.stringify(alphaAsset));
            handleChange("history");
          }}
          className={classNames("navbar-item", {
            active: activeBar === "history",
          })}
        >
          <HistoryIco height="24" width="24" />
          <span>History</span>
        </div>
      )}
    </div>
  );
}
