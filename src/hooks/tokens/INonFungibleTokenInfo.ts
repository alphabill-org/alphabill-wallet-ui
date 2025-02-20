import { type IUnitId } from '@alphabill/alphabill-js-sdk/lib/IUnitId';

import { ITokenIcon } from './ITokenIcon';

export interface INonFungibleTokenInfo {
  readonly unitId: IUnitId;
  readonly typeId: IUnitId;
  readonly name: string;
  readonly icon: ITokenIcon;
  readonly counter: bigint;
}
