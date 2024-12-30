import { TokenIcon } from "@alphabill/alphabill-js-sdk/lib/tokens/TokenIcon";
import { AlphaType, TokenType } from "../utils/constants";

export interface ITransferFormNFT {
  assets: {
    value: {
      value: INFTAsset | undefined;
      label: string;
    };
    label: string;
  };
  address: string;
  password: string;
}

export interface ITransferForm {
  assets: {
    value: IBill | IFungibleAsset | undefined;
    label: string;
  };
  amount: string;
  address: string;
  password: string;
}

export interface IFeeCreditForm {
  amount: string;
  assets: { value: string; label: string };
  password: string;
}

export interface IAccount {
  pubKey: string;
  name: string;
  balance?: string;
  assets: { fungible: IFungibleAsset[]; nft: INFTAsset[] | [] };
  activities: IActivity[];
  activeNetwork?: string;
  networks: INetwork[];
  idx?: number | string;
}

export interface INFTAsset {
  id: string; // base64 encoded hex
  typeId: string; // base64 encoded hex
  owner: string; // base64 encoded hex - bearer predicate
  kind: number; // [2:Fungible|4:NonFungible]
  txHash: string; // base64 encoded hex - latest tx
  symbol: string;
  nftData: string;
  nftDataUpdatePredicate: string;
  network: string;
  amountOfSameType?: string;
  isSendable?: boolean;
  nftName?: string;
}

export interface IFungibleAsset {
  id: string;
  amount: string;
  network: string;
  decimals: number;
  UIAmount: string;
  typeId: string;
  isSendable: boolean;
  symbol: string;
}

export interface IListTokensResponse {
  id: string; // base64 encoded hex
  typeId: string; // base64 encoded hex
  owner: string; // base64 encoded hex - bearer predicate
  amount?: string; // fungible only
  value?: string; // fungible only
  decimals?: number; // fungible only
  kind: number; // [2:Fungible|4:NonFungible]
  txHash: string; // base64 encoded hex - latest tx
  symbol: string;
  nftUri?: string; // nft only
  UIAmount?: string; // fungible only
  nftData?: string; // nft only
  nftDataUpdatePredicate?: string; // nft only
  network: string;
  nftName?: string; // nft only
  invariantPredicate?: string; // fungible only
  icon: TokenIcon;
}

export interface IActiveAsset {
  typeId: string;
  id?: string;
  amount?: string;
  network?: string;
  decimals?: number;
  UIAmount?: string;
  isSendable?: boolean;
  symbol?: string;
  value?: string;
  txHash?: string;
  kind?: number;
  targetUnitId?: string;
  nftUri?: string;
  nftData?: string;
  nftName?: string;
  name?: string;
}

export interface IBill {
  id: string; // base64
  value: string;
  txHash: string;
  typeId?: string;
  kind?: number;
  decimals?: number;
  targetUnitId?: string;
}

export interface IBillsList {
  total: number;
  bills: IBill[];
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
  amount: string;
  swap?: ISwap;
  time: string;
  address: string;
  type: "Buy" | "Transfer" | "Swap" | "Receive";
  network: string;
  fromID?: string;
  fromAmount?: string;
  fromAddress?: string;
}

export interface IBalance {
  balance: number;
  pubKey: string;
}

export interface IFeeCreditBills {
  [AlphaType]: {
    id: string;
    value: string;
    txHash: string;
    lastAddFcTxHash: string;
  } | null;
  [TokenType]: {
    id: string;
    value: string;
    txHash: string;
    lastAddFcTxHash: string;
  } | null;
}

export type IActionViews =
  | "Transfer fungible view"
  | "Transfer NFT view"
  | "Transfer Fee Credit view"
  | "Fungible list view"
  | "NFT list view"
  | "Profile view"
  | "NFT details view"
  | "";

export type INavbarViews = "fungible" | "nonFungible" | "fees";
