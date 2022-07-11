import { useState } from "react";
import { Checkbox, FormControlLabel } from "@material-ui/core";
import classNames from "classnames";

import Button from "../Button/Button";

import Logo from "../../images/ab-logo-ico.svg";
import Profile from "../../images/profile.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import { ReactComponent as Close } from "../../images/close.svg";
import { ReactComponent as Check } from "../../images/check.svg";

import { IAccountProps } from "../../types/Types";

function Header(props: IAccountProps): JSX.Element | null {
  const [showTestNetworks, setShowTestNetworks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const testNetworks = props.account?.networks?.filter(
    (network) => network.isTestNetwork === true
  );
  const mainNetworks = props.account?.networks?.filter(
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
          {props.account?.activeNetwork || "Select Network"}
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
                    checked={showTestNetworks}
                    onChange={() => setShowTestNetworks(!showTestNetworks)}
                    name="TestNetworks"
                    color="primary"
                  />
                }
                label="Show Test Networks"
              />
            </div>
            <div className="select__options">
              {mainNetworks?.map((network) => {
                return (
                  <div
                    key={network.id}
                    className="select__option"
                    onClick={() => {
                      const updatedAccounts = props.accounts?.map((obj) => {
                        if (props.account?.id === obj.id) {
                          return { ...obj, activeNetwork: network.id };
                        } else return { ...obj };
                      });
                      setIsPopoverOpen(false);
                      props.setAccounts(updatedAccounts);
                    }}
                  >
                    {network.id} {network.id === props.account?.activeNetwork && <Check />}
                  </div>
                );
              })}
              <div
                className={classNames("select__popover-test-networks", {
                  "select__popover-test-networks--hidden": !showTestNetworks,
                })}
              >
                Test Networks
              </div>
              {testNetworks?.map((network) => {
                return (
                  <div
                    key={network.id}
                    className={classNames("select__option", {
                      "select__option--hidden": !showTestNetworks,
                    })}
                    onClick={() => {
                      const updatedAccounts = props.accounts?.map((obj) => {
                        if (props.account?.id === obj.id) {
                          return { ...obj, activeNetwork: network.id };
                        } else return { ...obj };
                      });
                      setIsPopoverOpen(false);
                      props.setAccounts(updatedAccounts);
                    }}
                  >
                    {network.id} {network.id === props.account?.activeNetwork && <Check />}
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
          props.setActionsView("Account");
          props.setIsActionsViewVisible(true);
        }}
      >
        <img height="32" width="32px" src={Profile} alt="Profile" />
      </Button>
    </div>
  );
}

export default Header;
