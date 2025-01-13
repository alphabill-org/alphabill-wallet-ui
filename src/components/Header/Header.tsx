import { ReactElement, useContext, useState } from "react";
import { NetworkContext } from "../../hooks/network";
import LogoIcon from "../../images/ab-logo-ico.svg?react";
import ArrowIcon from "../../images/arrow.svg?react";
import CheckIcon from "../../images/check.svg?react";
import ProfileIcon from "../../images/profile.svg?react";
import Button from "../Button/Button";
import SelectPopover from "../SelectPopover/SelectPopover";

function NetworkSelect() {
  const networkContext = useContext(NetworkContext);
  const networks = networkContext?.networks ? Array.from(networkContext?.networks.entries()) : [];

  return (
    <div className="select__options">
      {networks.map(([id, value]) => {
        return (
          <div
            key={id}
            className="select__option"
            onClick={() => {
              networkContext?.setSelectedNetwork(id);
            }}
          >
            {value.alias} {networkContext?.selectedNetworkId === id ? <CheckIcon /> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function Header(): ReactElement {
  const networkContext = useContext(NetworkContext);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const selectedNetwork = networkContext?.selectedNetworkId
    ? (networkContext.networks.get(networkContext.selectedNetworkId) ?? null)
    : null;

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
          {selectedNetwork?.alias ?? "--- SELECT NETWORK ---"}
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
