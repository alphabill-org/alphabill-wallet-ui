import { AxiosError } from "axios";
import { QueryObserverResult, useQueries, useQuery } from "react-query";
import { IBillsList } from "../types/Types";
import { getBalance, getBillsList } from "./requests";

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


/*
export function useGetBillsList(
  ids: string[] | undefined
) {
  return useQueries<Array<QueryObserverResult<any, AxiosError>>>(
    ids!.map((id) => {
      return {
        queryKey: ["billsList", id],
        queryFn: async () => getBillsList(id),
        enabled: !!id,
        staleTime: Infinity,
      };
    })
  );
}
*/