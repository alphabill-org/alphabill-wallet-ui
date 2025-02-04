import { ReactElement, useCallback } from 'react';

import { INetwork, useNetwork } from '../../hooks/networkContext';
import CheckIcon from '../../images/check-ico.svg?react';
import { SelectBox } from '../SelectBox/SelectBox';

interface INetworkSelectProps {
  label?: string;
}

export const NetworkSelect = ({ label }: INetworkSelectProps): ReactElement => {
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
    <div className="select__options">
      <SelectBox
        title="SELECT NETWORK"
        label={label}
        selectedItem={selectedNetwork?.alias}
        data={networks}
        select={select}
        getOptionKey={getOptionKey}
        createOption={createOption}
      />
    </div>
  );
};
