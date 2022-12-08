import { AxiosError } from "axios";
import { QueryObserverResult, useQueries, useQuery } from "react-query";
import {
  IBillsList,
  IProofsProps,
  ISwapTransferProps,
  ITransfer,
} from "../types/Types";
import {
  getBalance,
  getBillsList,
  getProof,
  makeTransaction,
} from "./requests";

export function useGetBalances(ids: string[] | undefined, url: string) {
  console.log("useGetBalances", url);

  return useQueries<Array<QueryObserverResult<any, AxiosError>>>(
    ids!.map((id) => {
      return {
        queryKey: ["balance", id],
        queryFn: async () => getBalance(id, url),
        enabled: !!id,
        staleTime: Infinity,
      };
    })
  );
}

export function useGetBillsList(
  id: string,
  url: string
): QueryObserverResult<IBillsList, AxiosError> {
  return useQuery([`billsList`, id], async () => getBillsList(id, url), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useGetProof(
  id: string,
  key: string,
  url: string
): QueryObserverResult<IProofsProps, AxiosError> {
  return useQuery([`proof`, id], async () => getProof(id, key, url), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useMakeTransaction(
  data: any,
  url: string
): QueryObserverResult<ITransfer | ISwapTransferProps, AxiosError> {
  return useQuery([`transaction`], async () => makeTransaction(data, url), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}
