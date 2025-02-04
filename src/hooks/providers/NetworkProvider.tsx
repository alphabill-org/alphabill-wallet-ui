import { PropsWithChildren, ReactElement, useCallback, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Network, INetwork } from '../network';

const NETWORKS_LOCAL_STORAGE_KEY = 'alphabill_networks';
const SELECTED_NETWORK_LOCAL_STORAGE_KEY = 'alphabill_selected_network';

interface INetworkState {
  networks: INetwork[];
  selectedNetwork: INetwork | null;
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

export function NetworkProvider({ children }: PropsWithChildren): ReactElement {
  const [state, dispatch] = useReducer(
    reducer,
    {
      networks: [],
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
      dispatch({ network, type: NetworkReducerAction.SET_ACTIVE_NETWORK });
    },
    [dispatch],
  );

  const addNetwork = useCallback(
    (network: Omit<INetwork, 'id'>) => {
      dispatch({
        network: {
          ...network,
          id: uuidv4(),
        },
        type: NetworkReducerAction.ADD_NETWORK,
      });
    },
    [dispatch],
  );

  return (
    <Network.Provider
      value={{
        addNetwork,
        networks: state.networks,
        selectedNetwork: state.selectedNetwork,
        setSelectedNetwork,
      }}
    >
      {children}
    </Network.Provider>
  );
}
