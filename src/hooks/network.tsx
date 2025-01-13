import { createContext, PropsWithChildren, useCallback, useReducer } from "react";
import { v4 as uuidv4 } from "uuid";

const NETWORKS_LOCAL_STORAGE_KEY = "alphabill_networks";
const SELECTED_NETWORK_LOCAL_STORAGE_KEY = "alphabill_networks";

interface INetwork {
  readonly alias: string;
  readonly moneyPartitionUrl: string;
  readonly tokenPartitionUrl: string;
}

export interface INetworkContext {
  readonly networks: Map<string, INetwork>;
  readonly selectedNetworkId: string | null;
  setSelectedNetwork(id: string | null): void;
  addNetwork(network: INetwork): void;
}

export const NetworkContext = createContext<INetworkContext | null>(null);

interface INetworkState {
  readonly networks: Map<string, INetwork>;
  readonly selectedNetworkId: string | null;
}

enum NetworkReducerAction {
  SET_ACTIVE_NETWORK = "SET_ACTIVE_NETWORK",
  ADD_NETWORK = "ADD_NETWORK",
}

function reducer(
  previousState: INetworkState,
  action:
    | { type: NetworkReducerAction.SET_ACTIVE_NETWORK; id: string | null }
    | { type: NetworkReducerAction.ADD_NETWORK; network: INetwork },
): INetworkState {
  switch (action.type) {
    case NetworkReducerAction.SET_ACTIVE_NETWORK:
      return {
        ...previousState,
        selectedNetworkId: action.id,
      };
    case NetworkReducerAction.ADD_NETWORK:
      return {
        ...previousState,
        networks: new Map(previousState.networks).set(uuidv4(), action.network),
      };
    default:
      throw new Error(`Unknown network action ${String(action)}`);
  }
}

export default function NetworkProvider({ children }: PropsWithChildren<object>) {
  const [state, dispatch] = useReducer(
    reducer,
    {
      networks: [],
      selectedNetwork: null,
    },
    (): INetworkState => {
      const networksString = localStorage.getItem(NETWORKS_LOCAL_STORAGE_KEY);
      const networks = networksString ? JSON.parse(networksString) : [];
      const selectedNetworkString = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY);
      const selectedNetwork = selectedNetworkString ? JSON.parse(selectedNetworkString) : null;

      return {
        networks,
        selectedNetworkId: selectedNetwork,
      };
    },
  );

  const setSelectedNetwork = useCallback(
    (id: string | null): void => {
      dispatch({ type: NetworkReducerAction.SET_ACTIVE_NETWORK, id });
    },
    [dispatch],
  );

  const addNetwork = useCallback(
    (network: INetwork) => {
      dispatch({
        type: NetworkReducerAction.ADD_NETWORK,
        network,
      });
    },
    [dispatch],
  );

  return (
    <NetworkContext.Provider
      value={{
        networks: state.networks,
        selectedNetworkId: state.selectedNetworkId,

        setSelectedNetwork,
        addNetwork,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}
