import { ITokenIcon } from '../units/ITokenIcon';

export interface IFungibleTokenInfo<Unit> {
  readonly id: string;
  readonly name: string;
  readonly decimalPlaces: number;
  readonly icon: ITokenIcon;
  readonly units: Unit[];
  readonly total: bigint;
}
