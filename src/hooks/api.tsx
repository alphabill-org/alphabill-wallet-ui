import { AxiosError } from "axios";
import { QueryObserverResult, useQueries } from "react-query";
import { getBalance } from "./requests";

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
