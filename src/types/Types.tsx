export interface IAccount {
  pubKey: string;
  name: string;
  balance?: number;
  assets: IAsset[];
  activities: IActivity[];
  activeNetwork?: string;
  networks: INetwork[];
  idx?: number | string;
}

export interface IAsset {
  id: string;
  name: string;
  amount: number;
  network: string;
}

export interface IBill {
  id: string;
  value: number;
}

export interface IBillsList {
  total: number;
  bills: IBill[];
}

export interface IBlockStats {
  blockHeight: number;
}

export interface INetwork {
  id: string;
  isTestNetwork: boolean;
}

export interface ISwap {
  from: string;
  top: string;
}

export interface ITransfer {
  system_id: string;
  unit_id: string;
  type: string;
  attributes: {
    backlink: string;
    new_bearer: string;
    target_value: number;
  },
  timeout: number;
  owner_proof: string;
}


export interface ISplit {
  system_id: string;
  unit_id: string;
  type: string;
  attributes: {
    amount: number;
    backlink: string;
    remaining_value: number;
    target_bearer: string;
  },
  timeout: number;
  owner_proof: string;
}

export interface IActivity {
  id: string;
  name: string;
  amount: number;
  swap?: ISwap;
  time: string;
  address: string;
  type: "Buy" | "Send" | "Swap" | "Receive";
  network: string;
  fromID?: string;
  fromAmount?: string | number;
  fromAddress?: string;
}

export interface ITransferProps {
  setAccounts: (e: IAccount[]) => void;
  account?: IAccount;
  accounts?: IAccount[];
  setIsActionsViewVisible: (e: boolean) => void;
}
