
export interface IAccount {
  id: string;
  assets: IAsset[];
  activities: IActivity[];
  networks: INetwork[];
  isLoggedIn: boolean;
}

export interface IAsset {
  id: string;
  amount: number;
}

export interface IAccountProps {
  setAccounts: (e: any) => void;
  accounts?: IAccount[];
  account?: IAccount;
}

export interface INetwork {
  id: string;
  isActive: boolean;
  isTestNetwork: boolean;
}

export interface IActivity {
  id: string;
  amount: number;
  date: Date;
  address: string;
  type: 'Buy' | 'Send' | 'Swap';
  network: string;
}
