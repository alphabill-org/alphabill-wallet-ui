import { ReactElement, useState } from "react";
import { useNetwork } from "../../hooks/network";
import LogoIcon from "../../images/ab-logo-ico.svg?react";
import ArrowIcon from "../../images/arrow.svg?react";
import CheckIcon from "../../images/check.svg?react";
import ProfileIcon from "../../images/profile.svg?react";
import { Button } from "../Button/Button";
import { SelectPopover } from "../SelectPopover/SelectPopover";

function NetworkSelect(): ReactElement {
  const networkContext = useNetwork();

  return (
    <div className="select__options">
      {networkContext.networks.map((network) => {
        return (
          <div
            key={network.id}
            className="select__option"
            onClick={() => {
              networkContext.setSelectedNetwork(network);
            }}
          >
            {network.alias} {networkContext.selectedNetwork?.id === network.id ? <CheckIcon /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function Header(): ReactElement {
  const networkContext = useNetwork();
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
          {networkContext.selectedNetwork?.alias ?? "--- SELECT NETWORK ---"}
          <ArrowIcon className="select__button--icon" />
        </Button>
        <SelectPopover
          onClose={() => {
            setIsPopoverOpen(false);
          }}
          isPopoverVisible={isPopoverOpen}
          title="SELECT NETWORK"
        >
          <NetworkSelect />
        </SelectPopover>
      </div>
      <Button
        variant="icon"
        onClick={() => {
          // PROFILE VIEW
        }}
      >
        <ProfileIcon />
      </Button>
    </div>
  );
}
