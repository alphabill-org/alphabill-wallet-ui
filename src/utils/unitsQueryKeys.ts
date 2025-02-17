import type { IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';
import { PartitionIdentifier } from '@alphabill/alphabill-js-sdk/lib/PartitionIdentifier';
import { Query, QueryKey } from '@tanstack/react-query';

export enum QUERY_KEYS {
  ALPHA = 'ALPHA',
  FEE_CREDIT = 'FEE_CREDIT',
  FUNGIBLE = 'FUNGIBLE',
  NON_FUNGIBLE = 'NON_FUNGIBLE',
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
  partition: PartitionIdentifier,
  networkId?: string,
): QueryKey {
  return [UNITS_KEY, type, FETCH_UNITS_KEY, unitsListExists, ownerId, networkId, partition];
}

export function createFetchUnitTypesQueryKey(
  type: QUERY_KEYS,
  ownerId: string | null,
  unitsListExists: boolean,
  partition: PartitionIdentifier,
  networkId?: string,
): QueryKey {
  return [UNITS_KEY, type, FETCH_TYPES_KEY, unitsListExists, ownerId, networkId, partition];
}

export function createFetchUnitByIdQueryKey(
  type: QUERY_KEYS,
  ownerId: string | null,
  partition: PartitionIdentifier,
  networkId?: string,
): (unitId: IUnitId) => QueryKey {
  return (unitId: IUnitId) => [UNITS_KEY, type, FETCH_UNIT_BY_ID_KEY, unitId.toString(), ownerId, networkId, partition];
}

export function createFetchTypeByIdQueryKey(
  type: QUERY_KEYS,
  ownerId: string | null,
  partition: PartitionIdentifier,
  networkId?: string,
): (unitId: IUnitId) => QueryKey {
  return (unitId: IUnitId) => [UNITS_KEY, type, FETCH_TYPE_BY_ID_KEY, unitId.toString(), ownerId, networkId, partition];
}

export function createUnitListQueryKey(
  ownerId: string | null,
  partition: PartitionIdentifier,
  networkId?: string,
): QueryKey {
  return [UNITS_KEY, 'ID', ownerId, networkId, partition];
}

export function createInvalidateUnitByIdPredicate(
  query: Query,
  partition: PartitionIdentifier,
  type?: QUERY_KEYS,
  id?: string,
): boolean {
  const { queryKey } = query;
  return (
    queryKey.at(0) === UNITS_KEY &&
    (type == null ? true : queryKey.at(1) === type) &&
    queryKey.at(2) === FETCH_UNIT_BY_ID_KEY &&
    (id == null ? true : queryKey.at(3) === id) &&
    queryKey.at(6) === partition
  );
}

export function createInvalidateUnitsPredicate(
  query: Query,
  partition: PartitionIdentifier,
  type?: QUERY_KEYS,
): boolean {
  const { queryKey } = query;
  return (
    queryKey.at(0) === UNITS_KEY &&
    (type == null ? true : queryKey.at(1) === type) &&
    queryKey.at(2) === FETCH_UNITS_KEY &&
    queryKey.at(6) === partition
  );
}

export function createInvalidateUnitListPredicate(query: Query, partition: PartitionIdentifier): boolean {
  const { queryKey } = query;
  return queryKey.at(0) === UNITS_KEY && queryKey.at(1) === FETCH_LIST_KEY && queryKey.at(4) === partition;
}
