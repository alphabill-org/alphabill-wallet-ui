
export interface IAsset {
  id: string;
  amount: number;
}
export interface IAssetProps {
  setAssets: (e: any) => void;
  assets: IAsset[];
}

export interface IUser {
  id: string;
  isLoggedIn: boolean;
}
export interface IUserProps {
  setUser: (e: any) => void;
  User?: IUser;
}

export interface IAccount {
  id: string;
  address: string;
  assets: IAsset[];
}
export interface IAccountProps {
  setAccounts: (e: any) => void;
  accounts: IAccount[];
}

export interface INetwork {
  id: string;
  isActive: boolean;
  isTestNetwork: boolean;
}
export interface INetworkProps {
  setNetworks: (e: any) => void;
  networks: INetwork[];
}

export interface IActivity {
  id: string;
  amount: number;
  date: Date;
  address: string;
  type: 'Buy' | 'Send' | 'Swap';
}
export interface IActivityProps {
  setActivities: (e: any) => void;
  activities: IActivity[];
}