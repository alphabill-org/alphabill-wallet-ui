import { useState } from "react";
import { Checkbox, FormControlLabel } from "@material-ui/core";
import classNames from "classnames";

import Button from "../Button/Button";

import Logo from "../../images/ab-logo-ico.svg";
import Profile from "../../images/profile.svg";
import { ReactComponent as Arrow } from "../../images/arrow.svg";
import { ReactComponent as Close } from "../../images/close.svg";
import { ReactComponent as Check } from "../../images/check.svg";

import { INetwork, INetworkProps } from "../../types/Types";
import { setNestedObjectValues } from "formik";

function Header(props: INetworkProps): JSX.Element | null {
  const [showTestNetworks, setShowTestNetworks] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const activeNetwork = props.networks?.find(
    (network) => network.isActive === true
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
          {activeNetwork ? activeNetwork.id : "Select Network"}
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
              {props.networks?.map((network) => {
                return (
                  <div
                    className={classNames("select__option", {
                      "select__option--hidden":
                        !showTestNetworks && network.isTestNetwork,
                    })}
                    onClick={() => {
                      const updatedData = props.networks?.map((obj) => {
                        if (obj.id === network.id) {
                          return { ...obj, isActive: true };
                        } else return { ...obj, isActive: false };
                      });

                      props.setNetworks(updatedData);
                    }}
                  >
                    {network.id} {network.isActive && <Check />}
                  </div>
                );
              })}
            </div>
          </div>{" "}
        </div>
      </div>
      <Button variant="icon">
        <img height="32" width="32px" src={Profile} alt="Profile" />
      </Button>
    </div>
  );
}

export default Header;
