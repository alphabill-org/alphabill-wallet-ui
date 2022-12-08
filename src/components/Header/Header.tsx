import { useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import classNames from "classnames";

import Button from "../Button/Button";
import Logo from "../../images/ab-logo-ico.svg";
import Profile from "../../images/profile.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import { ReactComponent as Close } from "../../images/close.svg";
import { ReactComponent as Check } from "../../images/check.svg";
import { useApp } from "../../hooks/appProvider";

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

  return (
    <div className="header">
      <div className="header__ico">
        <img height="32" src={Logo} alt="Alphabill" />
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
        <div
          className={classNames("select__popover-wrap", {
            "select__popover-wrap--open": isPopoverOpen,
          })}
        >
          <div className="select__popover">
            <div className="select__popover-header">
              <div>Select Network</div>
              <Close onClick={() => setIsPopoverOpen(!isPopoverOpen)} />
            </div>
            <div className="select__popover-checkbox">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showTestNetworks || Boolean(isTestNetworkActive)}
                    onChange={() => setShowTestNetworks(!showTestNetworks)}
                    name="TestNetworks"
                    color="primary"
                  />
                }
                label="Show Test & Dev Networks"
              />
            </div>
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
                Test & Dev Networks
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
          </div>{" "}
        </div>
      </div>
      <Button
        variant="icon"
        onClick={() => {
          setActionsView("Account");
          setIsActionsViewVisible(true);
        }}
      >
        <img height="32" width="32px" src={Profile} alt="Profile" />
      </Button>
    </div>
  );
}

export default Header;
