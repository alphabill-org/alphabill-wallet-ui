import { ITokenIcon } from '../units/ITokenIcon';

export interface IFungibleTokenInfo<T> {
  readonly id: string;
  readonly name: string;
  readonly decimalPlaces: number;
  readonly icon: ITokenIcon;
  readonly units: T[];
  readonly total: bigint;
}
