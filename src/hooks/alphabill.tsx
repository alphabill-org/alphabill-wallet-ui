import { MoneyPartitionJsonRpcClient } from "@alphabill/alphabill-js-sdk/lib/json-rpc/MoneyPartitionJsonRpcClient";
import { TokenPartitionJsonRpcClient } from "@alphabill/alphabill-js-sdk/lib/json-rpc/TokenPartitionJsonRpcClient";
import { createMoneyClient, createTokenClient, http } from "@alphabill/alphabill-js-sdk/lib/StateApiClientFactory";
import { createContext, PropsWithChildren, ReactElement, useContext, useMemo } from "react";
import { useNetwork } from "./network";

interface IAlphabillContext {
  moneyClient: MoneyPartitionJsonRpcClient | null;
  tokenClient: TokenPartitionJsonRpcClient | null;
}

const AlphabillContext = createContext<IAlphabillContext | null>(null);

export function useAlphabill(): IAlphabillContext {
  const context = useContext(AlphabillContext);

  if (!context) {
    throw new Error("Invalid alphabill context.");
  }

  return context;
}

export function AlphabillProvider({ children }: PropsWithChildren): ReactElement {
  const { selectedNetwork } = useNetwork();

  const { moneyClient, tokenClient } = useMemo((): IAlphabillContext => {
    if (!selectedNetwork) {
      return {
        moneyClient: null,
        tokenClient: null,
      };
    }

    return {
      moneyClient: createMoneyClient({ transport: http(selectedNetwork.moneyPartitionUrl) }),
      tokenClient: createTokenClient({ transport: http(selectedNetwork.tokenPartitionUrl) }),
    };
  }, [selectedNetwork]);

  return <AlphabillContext.Provider value={{ moneyClient, tokenClient }}>{children}</AlphabillContext.Provider>;
}
