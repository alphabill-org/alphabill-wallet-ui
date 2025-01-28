import { ReactElement } from 'react';

import { useNetwork } from '../../hooks/network';
import LogoIcon from '../../images/ab-logo-ico.svg?react';
import CheckIcon from '../../images/check.svg?react';
import ProfileIcon from '../../images/profile.svg?react';
import { Button } from '../Button/Button';
import { SelectBox } from '../SelectBox/SelectBox';

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

  return (
    <div className="header">
      <div className="header__ico">
        <LogoIcon className="header__ico" />
      </div>
      <div className="header__select">
        <SelectBox title="SELECT NETWORK" selectedItem={networkContext.selectedNetwork?.alias}>
          <NetworkSelect />
        </SelectBox>
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
