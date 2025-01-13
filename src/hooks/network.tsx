import { createContext, PropsWithChildren, useReducer } from "react";

interface INetwork {
  alias: string;
  moneyPartitionUrl: string;
  tokenPartitionUrl: string;
}

export interface INetworkContext {
  readonly networks: INetwork[];
  readonly selectedNetwork: INetwork | null;
  setSelectedNetwork(network: INetwork | null): void;
  addNetwork(network: INetwork): void;
}

export const NetworkContext = createContext<INetworkContext | null>(null);

interface INetworkState {
  networks: INetwork[];
  selectedNetwork: INetwork | null;
}

enum NetworkReducerAction {
  SET_ACTIVE_NETWORK = "SET_ACTIVE_NETWORK",
  ADD_NETWORK = "ADD_NETWORK",
}

function reducer(
  previousState: INetworkState,
  action:
    | { type: NetworkReducerAction.SET_ACTIVE_NETWORK; network: INetwork | null }
    | { type: NetworkReducerAction.ADD_NETWORK; network: INetwork },
): INetworkState {
  switch (action.type) {
    case NetworkReducerAction.SET_ACTIVE_NETWORK:
      return {
        ...previousState,
        selectedNetwork: action.network,
      };
    case NetworkReducerAction.ADD_NETWORK:
      return {
        ...previousState,
        networks: [...previousState.networks, action.network],
      };
    default:
      throw new Error(`Unknown network action ${String(action)}`);
  }
}

export default function NetworkProvider({ children }: PropsWithChildren<object>) {
  const [state, dispatch] = useReducer(reducer, {
    networks: [],
    selectedNetwork: null,
  });

  const setSelectedNetwork = (network: INetwork | null): void => {
    dispatch({ type: NetworkReducerAction.SET_ACTIVE_NETWORK, network });
  };

  const addNetwork = (network: INetwork) => {
    dispatch({
      type: NetworkReducerAction.ADD_NETWORK,
      network,
    });
  };

  return (
    <NetworkContext.Provider
      value={{ networks: state.networks, selectedNetwork: state.selectedNetwork, setSelectedNetwork, addNetwork }}
    >
      {children}
    </NetworkContext.Provider>
  );
}
