import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { QueryClient, QueryKey } from '@tanstack/react-query';

import { CONCURRENT_QUERIES } from '../../constants';

export async function* fetchUnits<T>(
  data: ReadonlyArray<IUnitId>,
  create: (unitId: IUnitId) => Promise<T | null>,
  queryClient: QueryClient,
  createQueryKey: (unitId: IUnitId) => QueryKey,
): AsyncGenerator<T> {
  const input = [...data];
  let i = 0;
  const promises = new Map<number, Promise<{ queryId: number; data: T | null; queryKey: QueryKey }>>();
  while (input.length > 0 || promises.size > 0) {
    const unitId = input.shift();
    if (unitId) {
      const queryId = i;
      const queryKey = createQueryKey(unitId);
      const cachedData = queryClient.getQueryData<T>(queryKey);
      if (cachedData) {
        promises.set(queryId, Promise.resolve({ data: cachedData, queryId, queryKey }));
      } else {
        promises.set(
          queryId,
          create(unitId).then((data) => {
            return {
              data,
              queryId,
              queryKey,
            };
          }),
        );
      }
    }

    if (promises.size >= CONCURRENT_QUERIES || !unitId) {
      const { queryId, queryKey, data } = await Promise.race(promises.values());
      promises.delete(queryId);
      if (!data) {
        // TODO: Handle missing data from getUnit
        continue;
      }

      queryClient.setQueryData(queryKey, data);
      yield data;
    }

    i += 1;
  }
}
