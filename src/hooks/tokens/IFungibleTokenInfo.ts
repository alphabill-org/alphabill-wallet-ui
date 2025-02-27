import { ITokenIcon } from './ITokenIcon';

export interface IFungibleTokenInfo<T> {
  readonly id: string;
  readonly symbol: string;
  readonly decimalPlaces: number;
  readonly icon: ITokenIcon | null;
  readonly units: T[];
  readonly total: bigint;
}
