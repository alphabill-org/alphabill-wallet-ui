import { AxiosError } from "axios";
import { QueryObserverResult, useQueries, useQuery } from "react-query";
import {
  IBillsList,
  IListTokensResponse,
  ITypeHierarchy,
  ITokensListTypes,
  IFeeCreditBills,
  ITxProof,
} from "../types/Types";

import {
  fetchAllTypes,
  getBalance,
  getBillsList,
  getFeeCreditBills,
  getImageUrl,
  getImageUrlAndDownloadType,
  getProof,
  getTypeHierarchy,
  getUserTokens,
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

export function useGetAllNFTs(
  pubKey: string
): QueryObserverResult<IListTokensResponse[], AxiosError> {
  return useQuery(
    [`NFTsList`, pubKey],
    async () => getUserTokens(pubKey, "nft"),
    {
      enabled: true,
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );
}

export function useGetNFTs(
  pubKey: string,
  activeAsset: string | null
): QueryObserverResult<IListTokensResponse[], AxiosError> {
  return useQuery(
    [`NFTList`, pubKey, activeAsset],
    async () => activeAsset && getUserTokens(pubKey, "nft", activeAsset),
    {
      enabled: true,
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );
}

export function useGetImageUrl(
  url: string,
  handleRequest: boolean
): QueryObserverResult<
  { error: string | null; imageUrl: string | null },
  AxiosError
> {
  return useQuery(
    [`imageUrl`, url],
    async () => handleRequest && getImageUrl(url),
    {
      enabled: true,
      keepPreviousData: true,
      retry: false,
    }
  );
}

export function useGetFeeCreditBills(
  id: string
): QueryObserverResult<IFeeCreditBills, AxiosError> {
  return useQuery<IFeeCreditBills | any, AxiosError>(
    ["feeBillsList", id],
    () => getFeeCreditBills(id),
    {
      enabled: true,
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );
}

export function useGetImageUrlAndDownloadType(url: string): QueryObserverResult<
  {
    imageUrl: string | null;
    downloadType: string | null;
    error?: string;
  },
  AxiosError
> {
  return useQuery(
    [`imageUrlAndDownloadType`, url],
    async () => getImageUrlAndDownloadType(url),
    {
      enabled: true,
      keepPreviousData: true,
      retry: false,
    }
  );
}

export function useGetAllUserTokens(
  pubKey: string
): QueryObserverResult<IListTokensResponse[], AxiosError> {
  return useQuery(
    [`fungibleTokensList`, pubKey],
    async () => getUserTokens(pubKey, "fungible"),
    {
      enabled: true,
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );
}

export function useGetUserTokens(
  pubKey: string,
  activeAsset: string
): QueryObserverResult<IListTokensResponse[], AxiosError> {
  return useQuery(
    [`fungibleTokenList`, pubKey, activeAsset],
    async () => getUserTokens(pubKey, "fungible", activeAsset),
    {
      enabled: true,
      keepPreviousData: true,
      staleTime: Infinity,
    }
  );
}

export function useGetAllTokenTypes(
  pubKey: string
): QueryObserverResult<ITokensListTypes[], AxiosError> {
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
  billID: string,
  txHash: string
): QueryObserverResult<ITxProof, AxiosError> {
  return useQuery([`proof`, billID], async () => getProof(billID, txHash), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}
