import { ReactElement, useCallback } from 'react';

import { INetwork, useNetwork } from '../../hooks/network';
import LogoIcon from '../../images/ab-logo-ico.svg?react';
import CheckIcon from '../../images/check-ico.svg?react';
import ProfileIcon from '../../images/profile.svg?react';
import { Button } from '../Button/Button';
import { SelectBox } from '../SelectBox/SelectBox';

export function Header(): ReactElement {
  const { setSelectedNetwork, selectedNetwork, networks } = useNetwork();

  const select = useCallback(
    (network: INetwork) => {
      setSelectedNetwork(network);
    },
    [setSelectedNetwork],
  );

  const getOptionKey = useCallback((network: INetwork) => network.id, []);

  const createOption = useCallback(
    (network: INetwork) => (
      <>
        {network.alias} {selectedNetwork?.id === network.id ? <CheckIcon /> : null}
      </>
    ),
    [selectedNetwork],
  );

  return (
    <div className="header">
      <div className="header__ico">
        <LogoIcon />
      </div>
      <div className="header__select">
        <SelectBox
          title="SELECT NETWORK"
          selectedItem={selectedNetwork?.alias}
          data={networks}
          select={select}
          getOptionKey={getOptionKey}
          createOption={createOption}
        />
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
