import classNames from "classnames";
import { ReactElement, useState } from "react";
import LogoIcon from "../../images/ab-logo-ico.svg?react";
import ArrowIcon from "../../images/arrow.svg?react";
import CheckIcon from "../../images/check.svg?react";
import ProfileIcon from "../../images/profile.svg?react";
import Button from "../Button/Button";
import SelectPopover from "../SelectPopover/SelectPopover";

function Header(): ReactElement | null {
  // const [showTestNetworks, setShowTestNetworks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // const { setIsActionsViewVisible, setActionsView, account, accounts, setAccounts } = useApp();
  //
  // const testNetworks = account?.networks?.filter((network) => network.isTestNetwork === true);
  // const isTestNetworkActive = account?.networks?.find(
  //   (network) => network.isTestNetwork === true && account?.activeNetwork === network.id,
  // );
  // const mainNetworks = account?.networks?.filter((network) => network.isTestNetwork !== true);
  // const popupRef = useRef<HTMLDivElement>(null);
  //
  // useDocumentClick(() => {
  //   isPopoverOpen && setIsPopoverOpen(false);
  // }, popupRef);

  return (
    <div className="header">
      <div className="header__ico">
        <LogoIcon className="header__ico" />
      </div>
      <div
        className="header__select"
        onClick={() => {
          setIsPopoverOpen(true);
        }}
      >
        <Button variant="icon" className="select__button">
          ACCOUNT NAME
          <ArrowIcon className="select__button--icon" />
        </Button>
        <SelectPopover
          onClose={() => {
            setIsPopoverOpen(false);
          }}
          isPopoverVisible={isPopoverOpen}
          title="SELECT NETWORK"
        >
          <>
            <div className="select__options">
              {new Array(5).fill("0")?.map((value, index) => {
                return (
                  <div
                    key={index}
                    className={classNames("select__option", {
                      "select__option--hidden": false,
                    })}
                    onClick={() => {}}
                  >
                    NETWORK ID | <CheckIcon />
                  </div>
                );
              })}
            </div>
          </>
        </SelectPopover>
      </div>
      <Button
        variant="icon"
        onClick={() => {
          // PROFILE VIEW
        }}
      >
        <ProfileIcon className="header__settings" />
      </Button>
    </div>
  );
}

export default Header;
