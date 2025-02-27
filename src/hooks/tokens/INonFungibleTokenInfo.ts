import { type IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';

import { ITokenIcon } from './ITokenIcon';

export interface INonFungibleTokenInfo {
  readonly unitId: IUnitId;
  readonly typeId: IUnitId;
  readonly symbol: string;
  readonly icon: ITokenIcon | null;
  readonly counter: bigint;
}
