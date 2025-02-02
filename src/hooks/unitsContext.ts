import { UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

export interface ITokenIcon {
  readonly type: string;
  readonly data: string;
}

export interface ITokenUnit {
  readonly id: string;
  readonly value: bigint;
}

export interface ITokenInfo {
  readonly id: string;
  readonly name: string;
  readonly decimalPlaces: number;
  readonly icon: ITokenIcon;
  readonly units: ITokenUnit[];
  readonly total: bigint;
}

export interface IUnitsContext {
  readonly fungible: UseQueryResult<Map<string, ITokenInfo>>;
}

export const UnitsContext = createContext<IUnitsContext | null>(null);

export function useUnits(): IUnitsContext {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('Invalid units context');
  }

  return context;
}
