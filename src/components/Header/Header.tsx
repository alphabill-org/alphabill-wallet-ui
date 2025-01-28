import { ReactElement, useCallback } from 'react';

import { INetwork, useNetwork } from '../../hooks/network';
import LogoIcon from '../../images/ab-logo-ico.svg?react';
import CheckIcon from '../../images/check.svg?react';
import ProfileIcon from '../../images/profile.svg?react';
import { Button } from '../Button/Button';
import { SelectBox } from '../SelectBox/SelectBox';

export function Header(): ReactElement {
  const networkContext = useNetwork();

  const select = useCallback(
    (network: INetwork) => {
      networkContext.setSelectedNetwork(network);
    },
    [networkContext],
  );

  const getOptionKey = useCallback((network: INetwork) => network.id, []);

  const createOption = useCallback(
    (network: INetwork) => (
      <>
        {network.alias} {networkContext.selectedNetwork?.id === network.id ? <CheckIcon /> : null}
      </>
    ),
    [networkContext],
  );

  return (
    <div className="header">
      <div className="header__ico">
        <LogoIcon className="header__ico" />
      </div>
      <div className="header__select">
        <SelectBox
          title="SELECT NETWORK"
          selectedItem={networkContext.selectedNetwork?.alias}
          data={networkContext.networks}
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
