import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';

import { CONCURRENT_QUERIES } from '../../constants';

export async function* fetchUnits<T>(
  data: ReadonlyArray<IUnitId>,
  create: (unitId: IUnitId) => Promise<T | null>,
): AsyncGenerator<T> {
  const input = [...data];
  let i = 0;
  const promises = new Map<number, Promise<{ queryId: number; data: T | null }>>();
  while (input.length > 0 || promises.size > 0) {
    const unitId = input.shift();
    if (unitId) {
      const queryId = i;
      promises.set(
        queryId,
        create(unitId).then((data) => {
          return {
            data,
            queryId,
          };
        }),
      );
    }

    if (promises.size >= CONCURRENT_QUERIES || !unitId) {
      const { queryId, data } = await Promise.race(promises.values());
      promises.delete(queryId);
      if (!data) {
        continue;
      }

      yield data;
    }

    i += 1;
  }
}
