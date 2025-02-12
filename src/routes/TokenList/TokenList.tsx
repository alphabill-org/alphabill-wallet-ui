import { useQueryClient } from '@tanstack/react-query';
import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';

import { Button } from '../../components/Button/Button';
import { Footer } from '../../components/Footer/Footer';
import { Header } from '../../components/Header/Header';
import { PublicKeySelectBox } from '../../components/PublicKeySelectBox/PublicKeySelectBox';
import { useVault } from '../../hooks/vaultContext';
import AddIcon from '../../images/add-ico.svg?react';
import CopyIcon from '../../images/copy-ico.svg?react';
import SyncIcon from '../../images/sync-ico.svg?react';

export function TokenList(): ReactElement {
  const queryClient = useQueryClient();
  const vault = useVault();

  return (
    <>
      <Header />
      <div className="units">
        <div className="units__key">
          <PublicKeySelectBox />
          <Button
            type="button"
            variant="primary"
            isRounded={true}
            onClick={async () => {
              await navigator.clipboard.writeText(vault.selectedKey?.publicKey.hex ?? '');
            }}
          >
            <CopyIcon />
          </Button>
          <Button
            type="button"
            variant="primary"
            isRounded={true}
            onClick={async () => {
              await queryClient.resetQueries({
                predicate: (query) => {
                  return query.queryKey.at(0) === 'UNITS';
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
