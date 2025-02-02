import { createMoneyClient, createTokenClient, http } from '@alphabill/alphabill-js-sdk/lib/StateApiClientFactory';
import { PropsWithChildren, ReactElement, useMemo } from 'react';

import { AlphabillContext } from './alphabillContext';
import { useNetwork } from './networkContext';

export function AlphabillProvider({ children }: PropsWithChildren): ReactElement {
  const { selectedNetwork } = useNetwork();

  const context = useMemo((): IAlphabillContext | null => {
    if (!selectedNetwork) {
      return null;
    }

    return {
      moneyClient: createMoneyClient({ transport: http(selectedNetwork.moneyPartitionUrl) }),
      networkId: selectedNetwork.id,
      tokenClient: createTokenClient({ transport: http(selectedNetwork.tokenPartitionUrl) }),
    };
  }, [selectedNetwork]);

  return <AlphabillContext.Provider value={context}>{children}</AlphabillContext.Provider>;
}
