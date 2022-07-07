export interface IAccount {
  id: string;
  name: string;
  assets: IAsset[];
  activities: IActivity[];
  activeNetwork?: string;
  networks: INetwork[];
  isActive: boolean;
}

export interface IAsset {
  id?: string;
  name?: string;
  amount?: number;
  push?: any;
}

export interface IAccountProps {
  setAccounts: (e: any) => void;
  setActionsView: (e: any) => void;
  setIsActionsViewVisible: (e: any) => void;
  accounts: IAccount[];
  account?: IAccount;
}

export interface IActionProps {
  setIsActionsViewVisible: (e: any) => void;
  isActionsViewVisible: boolean;
  actionsView: string;
  account: IAccount;
  accounts?: IAccount[];
  setAccounts: (e: any) => void;
  setActionsView: (e: any) => void;
}

export interface IDashboardProps {
  account: IAccount;
  setActionsView: (e: any) => void;
  setIsActionsViewVisible: (e: any) => void;
}

export interface INetwork {
  id: string;
  isTestNetwork: boolean;
}

export interface ISwap {
  from: string;
  top: string;
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
}

export interface ITransferProps {
  setAccounts: (e: any) => void;
  account: IAccount;
  accounts?: IAccount[];
  setIsActionsViewVisible: (e: any) => void;
}