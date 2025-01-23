import { MoneyPartitionJsonRpcClient } from "@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient";
import { TokenPartitionJsonRpcClient } from "@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient";
import { createMoneyClient, createTokenClient, http } from "@alphabill/alphabill-js-sdk/lib/StateApiClientFactory";
import { createContext, PropsWithChildren, ReactElement, useContext, useMemo } from "react";
import { useNetwork } from "./network";

interface IAlphabillContext {
  moneyClient: MoneyPartitionJsonRpcClient;
  tokenClient: TokenPartitionJsonRpcClient;
}

const AlphabillContext = createContext<IAlphabillContext | null>(null);

export function useAlphabill(): IAlphabillContext | null {
  return useContext(AlphabillContext);
}

export function AlphabillProvider({ children }: PropsWithChildren): ReactElement {
  const { selectedNetwork } = useNetwork();

  const context = useMemo((): IAlphabillContext | null => {
    if (!selectedNetwork) {
      return null;
    }

    return {
      moneyClient: createMoneyClient({ transport: http(selectedNetwork.moneyPartitionUrl) }),
      tokenClient: createTokenClient({ transport: http(selectedNetwork.tokenPartitionUrl) }),
    };
  }, [selectedNetwork]);

  return <AlphabillContext.Provider value={context}>{children}</AlphabillContext.Provider>;
}
