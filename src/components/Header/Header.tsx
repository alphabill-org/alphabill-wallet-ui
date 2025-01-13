import classNames from "classnames";
import { ReactElement, useContext, useState } from "react";
import { NetworkContext } from "../../hooks/network";
import LogoIcon from "../../images/ab-logo-ico.svg?react";
import ArrowIcon from "../../images/arrow.svg?react";
import CheckIcon from "../../images/check.svg?react";
import ProfileIcon from "../../images/profile.svg?react";
import Button from "../Button/Button";
import SelectPopover from "../SelectPopover/SelectPopover";

function Header(): ReactElement | null {
  const network = useContext(NetworkContext);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
          {network?.selectedNetworkId
            ? network.networks.get(network.selectedNetworkId)?.alias
            : "--- SELECT NETWORK ---"}
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
              {network
                ? Array.from(network.networks).map(([id, value], index) => {
                    return (
                      <div
                        key={index}
                        className={classNames("select__option")}
                        onClick={() => {
                          network?.setSelectedNetwork(id);
                        }}
                      >
                        {value.alias} {network?.selectedNetworkId === id ? <CheckIcon /> : null}
                      </div>
                    );
                  })
                : null}
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
