import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { Query, QueryKey } from '@tanstack/react-query';

export enum QUERY_KEYS {
  ALPHA = 'ALPHA',
  FEE_CREDIT = 'FEE_CREDIT',
  FUNGIBLE = 'FUNGIBLE',
}

const UNITS_KEY = 'UNITS';
const FETCH_UNITS_KEY = 'UNITS';
const FETCH_UNIT_BY_ID_KEY = 'UNIT';
const FETCH_TYPES_KEY = 'TYPES';
const FETCH_TYPE_BY_ID_KEY = 'TYPE';
const FETCH_LIST_KEY = 'ID';

export function createFetchUnitsQueryKey(
  type: QUERY_KEYS,
  ownerId: string | null,
  unitsListExists: boolean,
  networkId?: string,
  partition?: PartitionIdentifier,
): QueryKey {
  return [UNITS_KEY, type, FETCH_UNITS_KEY, unitsListExists, ownerId, networkId, partition];
}

export function createFetchUnitTypesQueryKey(
  type: QUERY_KEYS,
  ownerId: string | null,
  unitsListExists: boolean,
  networkId?: string,
  partition?: PartitionIdentifier,
): QueryKey {
  return [UNITS_KEY, type, FETCH_TYPES_KEY, unitsListExists, ownerId, networkId, partition];
}

export function createFetchUnitByIdQueryKey(
  type: QUERY_KEYS,
  ownerId: string | null,
  networkId?: string,
  partition?: PartitionIdentifier,
): (unitId: IUnitId) => QueryKey {
  return (unitId: IUnitId) => [UNITS_KEY, type, FETCH_UNIT_BY_ID_KEY, unitId.toString(), ownerId, networkId, partition];
}

export function createFetchTypeByIdQueryKey(
  type: QUERY_KEYS,
  ownerId: string | null,
  networkId?: string,
  partition?: PartitionIdentifier,
): (unitId: IUnitId) => QueryKey {
  return (unitId: IUnitId) => [UNITS_KEY, type, FETCH_TYPE_BY_ID_KEY, unitId.toString(), ownerId, networkId, partition];
}

export function createUnitListQueryKey(
  ownerId: string | null,
  networkId?: string,
  partition?: PartitionIdentifier,
): QueryKey {
  return [UNITS_KEY, 'ID', ownerId, networkId, partition];
}

export function createInvalidateUnitByIdPredicate(query: Query, type: QUERY_KEYS, id: string): boolean {
  const { queryKey } = query;
  return (
    queryKey.at(0) === UNITS_KEY &&
    queryKey.at(1) === type &&
    queryKey.at(2) === FETCH_UNIT_BY_ID_KEY &&
    queryKey.at(3) === id
  );
}

export function createInvalidateUnitsPredicate(query: Query, type: QUERY_KEYS): boolean {
  const { queryKey } = query;
  return queryKey.at(0) === UNITS_KEY && queryKey.at(1) === type && queryKey.at(2) === FETCH_UNITS_KEY;
}

export function createInvalidateUnitListPredicate(query: Query, partition: PartitionIdentifier): boolean {
  const { queryKey } = query;
  return queryKey.at(0) === UNITS_KEY && queryKey.at(1) === FETCH_LIST_KEY && queryKey.at(4) === partition;
}
