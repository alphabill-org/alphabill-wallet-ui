import { AxiosError } from "axios";
import { QueryObserverResult, useQueries, useQuery } from "react-query";
import { IBillsList, IBlockStats, ITransfer } from "../types/Types";
import { getBalance, getBillsList, getBlockHeight, makeTransaction } from "./requests";

export function useGetBalances(
  ids: string[] | undefined
) {
  return useQueries<Array<QueryObserverResult<any, AxiosError>>>(
    ids!.map((id) => {
      return {
        queryKey: ["balance", id],
        queryFn: async () => getBalance(id),
        enabled: !!id,
        staleTime: Infinity,
      };
    })
  );
}

export function useGetBillsList(id: string): QueryObserverResult<IBillsList, AxiosError> {
  return useQuery([`billsList`, id], async () => getBillsList(id), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useGetBlockHeight(): QueryObserverResult<IBlockStats, AxiosError> {
  return useQuery([`blockHeight`], async () => getBlockHeight(), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useMakeTransaction(data: any): QueryObserverResult<ITransfer, AxiosError> {
  return useQuery([`transaction`], async () => makeTransaction(data), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}
