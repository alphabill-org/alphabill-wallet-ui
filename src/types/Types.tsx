export interface IAccount {
  id: string;
  balance: number;
  assets: IAsset[];
  activities: IActivity[];
  networks: INetwork[];
  isLoggedIn: boolean;
}

export interface IAsset {
  id: string;
  name: string;
  amount: number;
}

export interface IAccountProps {
  setAccounts: (e: any) => void;
  accounts?: IAccount[];
  account?: IAccount;
}

export interface IActionProps {
  setIsActionsViewVisible: (e: any) => void;
  isActionsViewVisible: boolean;
  actionsView: string;
}

export interface IDashboardProps {
  account: IAccount;
  setActionsView: (e: any) => void;
  setIsActionsViewVisible: (e: any) => void;
}

export interface INetwork {
  id: string;
  isActive: boolean;
  isTestNetwork: boolean;
}

export interface ISwap {
  from: string;
  top: string;
}

export interface IActivity {
  id: string;
  amount: number;
  swap?: ISwap;
  time: string;
  address: string;
  type: "Buy" | "Send" | "Swap";
  network: string;
}
