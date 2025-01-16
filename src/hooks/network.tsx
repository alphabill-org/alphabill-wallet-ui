import { createContext, PropsWithChildren, ReactElement, useCallback, useContext, useReducer } from "react";
import { v4 as uuidv4 } from "uuid";

const NETWORKS_LOCAL_STORAGE_KEY = "alphabill_networks";
const SELECTED_NETWORK_LOCAL_STORAGE_KEY = "alphabill_selected_network";

interface INetwork {
  readonly id: string;
  readonly alias: string;
  readonly moneyPartitionUrl: string;
  readonly tokenPartitionUrl: string;
}

interface INetworkState {
  readonly networks: INetwork[];
  readonly selectedNetwork: INetwork | null;
}

enum NetworkReducerAction {
  SET_ACTIVE_NETWORK,
  ADD_NETWORK,
}

function reducer(
  previousState: INetworkState,
  action: { type: NetworkReducerAction; network: INetwork },
): INetworkState {
  switch (action.type) {
    case NetworkReducerAction.SET_ACTIVE_NETWORK:
      localStorage.setItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY, action.network.id);
      return {
        ...previousState,
        selectedNetwork: action.network,
      };
    case NetworkReducerAction.ADD_NETWORK: {
      const networks = [...previousState.networks, action.network];
      localStorage.setItem(NETWORKS_LOCAL_STORAGE_KEY, JSON.stringify(networks));
      return {
        ...previousState,
        networks,
      };
    }
    default:
      throw new Error(`Unknown network action ${String(action)}`);
  }
}

const NetworkContext = createContext<INetworkContext | null>(null);

interface INetworkContext {
  readonly networks: INetwork[];
  readonly selectedNetwork: INetwork | null;
  setSelectedNetwork(id: INetwork): void;
  addNetwork(network: Omit<INetwork, "id">): void;
}

export function useNetwork(): INetworkContext {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("Invalid network context.");
  }

  return context;
}

export function NetworkProvider({ children }: PropsWithChildren<object>): ReactElement {
  const [state, dispatch] = useReducer(
    reducer,
    {
      networks: new Map(),
      selectedNetwork: null,
    },
    (): INetworkState => {
      const networksString = localStorage.getItem(NETWORKS_LOCAL_STORAGE_KEY);
      const networks: INetwork[] = networksString ? JSON.parse(networksString) : [];
      const id = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY);
      const selectedNetwork = networks.find((network) => network.id === id) ?? null;

      return {
        networks,
        selectedNetwork,
      };
    },
  );

  const setSelectedNetwork = useCallback(
    (network: INetwork): void => {
      dispatch({ type: NetworkReducerAction.SET_ACTIVE_NETWORK, network });
    },
    [dispatch],
  );

  const addNetwork = useCallback(
    (network: Omit<INetwork, "id">) => {
      dispatch({
        type: NetworkReducerAction.ADD_NETWORK,
        network: {
          ...network,
          id: uuidv4(),
        },
      });
    },
    [dispatch],
  );

  return (
    <NetworkContext.Provider
      value={{
        networks: state.networks,
        selectedNetwork: state.selectedNetwork,
        setSelectedNetwork,
        addNetwork,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}
