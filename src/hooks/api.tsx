import { AxiosError } from "axios";
import { QueryObserverResult, useQueries, useQuery } from "react-query";
import {
  IBillsList,
  IProofsProps,
  ISwapTransferProps,
  ITransfer,
} from "../types/Types";
import axios from "axios";

import {
  API_URL,
  getBalance,
  getBillsList,
  getProof,
  makeTransaction,
} from "./requests";

export function useGetBalances(ids: string[] | undefined) {
  return useQueries<Array<QueryObserverResult<any, AxiosError>>>(
    ids!.map((id) => {
      return {
        queryKey: ["balance", id],
        queryFn: async () =>
          getBalance(id).catch((e) => {
            if (e.response?.data?.message === "pubkey not indexed") {
              axios.post<void>(API_URL + "/admin/add-key", {
                pubkey: id,
              });
            }
          }),
        enabled: !!id,
        staleTime: Infinity,
      };
    })
  );
}

export function useGetBillsList(
  id: string
): QueryObserverResult<IBillsList, AxiosError> {
  return useQuery([`billsList`, id], async () => getBillsList(id), {
    enabled: true,
    keepPreviousData: true,
    staleTime: Infinity,
  });
}

export function useGetProof(
  id: string,
  key: string
): QueryObserverResult<IProofsProps, AxiosError> {
  return useQuery([`proof`, id, key], async () => getProof(id, key), {
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
