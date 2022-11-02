import { AxiosError } from "axios";
import { QueryObserverResult, useQuery } from "react-query";
import { getBalance } from "./requests";

export function useGetBalance(id: any): QueryObserverResult<any, AxiosError> {
  return useQuery([`balance`, id], async () => getBalance(id), {
    enabled: true,
    staleTime: Infinity,
  });
}
