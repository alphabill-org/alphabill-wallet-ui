import { AxiosError } from "axios";
import { QueryObserverResult, useQueries, useQuery } from "react-query";
import {
  IBillsList,
  IFungibleResponse,
  IProofsProps,
  ISwapTransferProps,
  ITransfer,
  ITypeHierarchy,
  IUserTokensListTypes,
} from "../types/Types";

import {
  fetchAllTypes,
  getBalance,
  getBillsList,
  getProof,
  getTypeHierarchy,
  getUserTokens,
  makeTransaction,
} from "./requests";

export function useGetBalances(pubKeys: string[] | undefined) {
  return useQueries<Array<QueryObserverResult<any, AxiosError>>>(
    pubKeys!.map((pubKey) => {
      return {
        queryKey: ["balance", pubKey],
        queryFn: async () => getBalance(pubKey),
        enabled: !!pubKey,
        staleTime: Infinity,
      };
    })
  );
}

export function useGetBillsList(
  pubKey: string
): QueryObserverResult<IBillsList, AxiosError> {
  return useQuery([`billsList`, pubKey], async () => getBillsList(pubKey), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useGetAllUserTokens(
  pubKey: string
): QueryObserverResult<IFungibleResponse[], AxiosError> {
  return useQuery([`tokensList`, pubKey], async () => getUserTokens(pubKey), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useGetUserTokens(
  pubKey: string,
  activeAsset: string
): QueryObserverResult<IFungibleResponse[], AxiosError> {
  return useQuery(
    [`tokenList`, pubKey, activeAsset],
    async () => getUserTokens(pubKey, activeAsset),
    {
      enabled: true,
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );
}

export function useGetAllTokenTypes(
  pubKey: string
): QueryObserverResult<IUserTokensListTypes[], AxiosError> {
  return useQuery([`tokenTypesList`, pubKey], async () => fetchAllTypes(), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useGeTypeHierarchy(
  typeId: string
): QueryObserverResult<ITypeHierarchy[], AxiosError> {
  return useQuery(
    [`typeHierarchy`, typeId],
    async () => getTypeHierarchy(typeId),
    {
      enabled: true,
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );
}

export function useGetProof(
  billID: string
): QueryObserverResult<IProofsProps, AxiosError> {
  return useQuery([`proof`, billID], async () => getProof(billID), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useMakeTransaction(
  data: any
): QueryObserverResult<ITransfer | ISwapTransferProps, AxiosError> {
  return useQuery([`transaction`], async () => makeTransaction(data), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}
