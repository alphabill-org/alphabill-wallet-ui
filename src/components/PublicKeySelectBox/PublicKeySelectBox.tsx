import { ReactElement, useCallback } from 'react';

import { IKeyInfo, useVault } from '../../hooks/vaultContext';
import CheckIcon from '../../images/check-ico.svg?react';
import { SelectBox } from '../SelectBox/SelectBox';

export function PublicKeySelectBox(): ReactElement {
  const { selectedKey, selectKey, keys } = useVault();

  const selectedItem = selectedKey ? (
    <>
      {selectedKey.alias}
      <span className="key__select--key">({selectedKey.publicKey.hex})</span>
    </>
  ) : undefined;

  const select = useCallback(
    (key: IKeyInfo) => {
      selectKey(key.index);
    },
    [selectedKey, selectKey],
  );

  const getOptionKey = useCallback((key: IKeyInfo) => key.index, []);

  const createOption = useCallback(
    (key: IKeyInfo) => (
      <>
        {key.alias} {selectedKey?.index === key.index ? <CheckIcon /> : null}
      </>
    ),
    [selectedKey],
  );

  return (
    <SelectBox
      title="SELECT KEY"
      className="key__select"
      selectedItem={selectedItem}
      data={keys}
      select={select}
      getOptionKey={getOptionKey}
      createOption={createOption}
    />
  );
}
