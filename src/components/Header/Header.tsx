import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Tooltip } from "react-tooltip";

import Button from "../Button/Button";
import { ReactComponent as Logo } from "../../images/ab-logo-ico.svg";
import { ReactComponent as Settings } from "../../images/settings-ico.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import { ReactComponent as CopyIco } from "../../images/copy-ico.svg";
import { useAuth } from "../../hooks/useAuth";

import { useApp } from "../../hooks/appProvider";
import { ProfileView } from "../../utils/constants";
import {
  tooltipHideDelay,
  tooltipOffset,
  tooltipShowDelay,
} from "../../test/constants";
import Popovers from "../Dashboard/Popovers";

function Header(): JSX.Element | null {
  const { setIsActionsViewVisible, setActionsView, account } = useApp();
  const [isKeySelectOpen, setIsKeySelectOpen] = useState(false);

  return (
    <div className="header">
      <div className="header__ico">
        <Button
          target="_blank"
          type="button"
          variant="icon"
          url="https://alphabill.org/"
        >
          <Logo height="40" width="40px" />
        </Button>
      </div>
      <div className="header__select">
        <div
          className="header__account"
          id={"account-id-" + account?.pubKey}
        >
          <Tooltip
            anchorId={"account-id-" + account?.pubKey}
            content={account?.pubKey}
            offset={tooltipOffset}
            clickable
            delayHide={tooltipHideDelay}
            delayShow={tooltipShowDelay}
          />
          <div
            className="header__account-id"
            onClick={() => setIsKeySelectOpen(!isKeySelectOpen)}
          >
            <span className="header__account-id-hover"></span>
            <span
              className="header__account-id-item"
              style={{
                maxWidth: 212,
              }}
            >
              <span className="t-ellipsis">{account?.name}</span>
            </span>
            <Arrow />
          </div>
          <div className="header__account-buttons">
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
        <Popovers
          isKeySelectOpen={isKeySelectOpen}
          setIsKeySelectOpen={(v) => setIsKeySelectOpen(v)}
        />
      </div>
      <Button
        variant="icon"
        onClick={() => {
          setActionsView(ProfileView);
          setIsActionsViewVisible(true);
        }}
      >
        <Settings height="24" width="24px" />
      </Button>
    </div>
  );
}

export default Header;
