import { useRef, useState } from "react";
import classNames from "classnames";

import Button from "../Button/Button";
import { ReactComponent as Logo } from "../../images/ab-logo-ico.svg";
import { ReactComponent as Profile } from "../../images/profile.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import { ReactComponent as Check } from "../../images/check.svg";
import { useApp } from "../../hooks/appProvider";
import Checkbox from "../Checkbox/Checkbox";
import { useDocumentClick } from "../../utils/utils";
import SelectPopover from "../SelectPopover/SelectPopover";

function Header(): JSX.Element | null {
  const [showTestNetworks, setShowTestNetworks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const {
    setIsActionsViewVisible,
    setActionsView,
    account,
    accounts,
    setAccounts,
  } = useApp();

  const testNetworks = account?.networks?.filter(
    (network) => network.isTestNetwork === true
  );
  const isTestNetworkActive = account?.networks?.find(
    (network) =>
      network.isTestNetwork === true && account?.activeNetwork === network.id
  );
  const mainNetworks = account?.networks?.filter(
    (network) => network.isTestNetwork !== true
  );
  const popupRef = useRef<HTMLDivElement>(null);

  useDocumentClick(() => {
    isPopoverOpen && setIsPopoverOpen(false);
  }, popupRef);

  return (
    <div className="header">
      <div className="header__ico">
        <Button type="button" variant="icon" url="https://alphabill.org/">
          <Logo height="40" width="40px" />
        </Button>
      </div>
      <div className="header__select">
        <Button
          variant="icon"
          className="select__button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        >
          {account?.activeNetwork || "Select Network"}
          <Arrow />
        </Button>
        <SelectPopover
          onClose={() => {
            setIsPopoverOpen(!isPopoverOpen);
          }}
          isPopoverVisible={isPopoverOpen}
          title="SELECT NETWORK"
        >
          <>
            {mainNetworks?.length >= 1 && (
              <div className="select__popover-checkbox">
                <Checkbox
                  label="Show test networks"
                  isChecked={showTestNetworks || Boolean(isTestNetworkActive)}
                  onChange={() => setShowTestNetworks(!showTestNetworks)}
                />
              </div>
            )}
            <div className="select__options">
              {mainNetworks?.map((network) => {
                return (
                  <div
                    key={network.id}
                    className="select__option"
                    onClick={() => {
                      const updatedAccounts = accounts?.map((obj) => {
                        if (account?.pubKey === obj?.pubKey) {
                          return { ...obj, activeNetwork: network.id };
                        } else return { ...obj };
                      });
                      setIsPopoverOpen(false);
                      setAccounts(updatedAccounts);
                      setShowTestNetworks(false);
                    }}
                  >
                    {network.id}{" "}
                    {network.id === account?.activeNetwork && <Check />}
                  </div>
                );
              })}
              <div
                className={classNames("select__popover-test-networks", {
                  "select__popover-test-networks--hidden":
                    !showTestNetworks && !Boolean(isTestNetworkActive),
                })}
              >
                Test networks
              </div>
              {testNetworks?.map((network) => {
                return (
                  <div
                    key={network.id}
                    className={classNames("select__option", {
                      "select__option--hidden":
                        !showTestNetworks && !Boolean(isTestNetworkActive),
                    })}
                    onClick={() => {
                      const updatedAccounts = accounts?.map((obj) => {
                        if (account?.pubKey === obj?.pubKey) {
                          return { ...obj, activeNetwork: network.id };
                        } else return { ...obj };
                      });
                      setIsPopoverOpen(false);
                      setAccounts(updatedAccounts);
                    }}
                  >
                    {network.id}{" "}
                    {network.id === account?.activeNetwork && <Check />}
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
          setActionsView("Profile");
          setIsActionsViewVisible(true);
        }}
      >
        <Profile className="profile-ico" height="32" width="32px" />
      </Button>
    </div>
  );
}

export default Header;
