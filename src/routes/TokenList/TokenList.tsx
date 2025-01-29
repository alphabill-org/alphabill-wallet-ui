import { useQueryClient } from '@tanstack/react-query';
import { ReactElement, useCallback } from 'react';
import { Outlet } from 'react-router-dom';

import { Button } from '../../components/Button/Button';
import { Footer } from '../../components/Footer/Footer';
import { Header } from '../../components/Header/Header';
import { SelectBox } from '../../components/SelectBox/SelectBox';
import { QUERY_KEYS } from '../../constants';
import { IKeyInfo, useVault } from '../../hooks/vault';
import AddIcon from '../../images/add-ico.svg?react';
import CheckIcon from '../../images/check-ico.svg?react';
import CopyIcon from '../../images/copy-ico.svg?react';
import SyncIcon from '../../images/sync-ico.svg?react';

export function TokenList(): ReactElement {
  const queryClient = useQueryClient();
  const vault = useVault();

  const selectedItem = vault.selectedKey ? (
    <>
      {vault.selectedKey.alias}
      <span className="units__key__select--key">({vault.selectedKey.publicKey})</span>
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
    <>
      <Header />
      <div className="units">
        <div className="units__key">
          <SelectBox
            title="SELECT KEY"
            className="units__key__select"
            selectedItem={selectedItem}
            data={vault.keys}
            select={select}
            getOptionKey={getOptionKey}
            createOption={createOption}
          />
          <Button
            type="button"
            variant="primary"
            isRounded={true}
            onClick={() => {
              navigator.clipboard.writeText(vault.selectedKey?.publicKey ?? '');
            }}
          >
            <CopyIcon />
          </Button>
          <Button
            type="button"
            variant="primary"
            isRounded={true}
            onClick={() => {
              queryClient.resetQueries({
                predicate: (query) => {
                  return query.queryKey.at(0) === QUERY_KEYS.units;
                },
              });
            }}
          >
            <SyncIcon />
          </Button>
          <Button type="button" variant="primary" isRounded={true} onClick={() => null}>
            <AddIcon />
          </Button>
        </div>
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
