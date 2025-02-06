import { ReactElement, useCallback } from 'react';

import { IKeyInfo, useVault } from '../../hooks/vault';
import CheckIcon from '../../images/check-ico.svg?react';
import { SelectBox } from '../SelectBox/SelectBox';

export function PublicKeySelectBox(): ReactElement {
  const vault = useVault();

  const selectedItem = vault.selectedKey ? (
    <>
      {vault.selectedKey.alias}
      <span className="key__select--key">({vault.selectedKey.publicKey})</span>
    </>
  ) : undefined;

  const select = useCallback(
    (key: IKeyInfo) => {
      vault.selectKey(key);
    },
    [vault],
  );

  const getOptionKey = useCallback((key: IKeyInfo) => key.index, []);

  const createOption = useCallback(
    (key: IKeyInfo) => (
      <>
        {key.alias} {vault.selectedKey?.index === key.index ? <CheckIcon /> : null}
      </>
    ),
    [vault],
  );

  return (
    <SelectBox
      title="SELECT KEY"
      className="key__select"
      selectedItem={selectedItem}
      data={vault.keys}
      select={select}
      getOptionKey={getOptionKey}
      createOption={createOption}
    />
  );
}
