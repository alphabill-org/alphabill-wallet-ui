import { AlphaType, TokenType } from "../utils/constants";
import { TokenIcon } from "@alphabill/alphabill-js-sdk/lib/transaction/TokenIcon";

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
  amount: string,
  assets: {value: string, label: string},
  password: string
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

export interface INFTTransferPayload {
  payload: {
    systemId: bigint;
    unitId: string;
    type: string;
    attributes: {
      nftType: string;
      backlink: string;
      newBearer?: string;
      invariantPredicateSignatures?: string[];
    };
    clientMetadata: {
      timeout: string;
      MaxTransactionFee: string;
      feeCreditRecordID?: Uint8Array | null;
    };
  };
  ownerProof: string;
}

export interface ITokensListTypes {
  id: string; // base64 encoded hex
  parentTypeId: string; // base64 encoded hex
  symbol: string;
  subTypeCreationPredicate: string;
  tokenCreationPredicate: string;
  invariantPredicate: string;
  decimals?: number; // fungible only
  kind: number; // [2:Fungible|4:NonFungible]
  txHash: string; // base64 encoded hex  creation tx
  nftDataUpdatePredicate?: string; //base64 encoded hex - nft only
  icon: { data: string; type: string };
  name: string;
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
  invariantPredicate?: string // fungible only
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

export interface INonFungibleAsset {
  id: string; // base64 encoded hex
  typeId: string; // base64 encoded hex
  owner: string; // base64 encoded hex - bearer predicate
  nftUri: string; // nft only
  nftData: string; // base64 encoded hex - nft only
  kind: number; // [2:Fungible|4:NonFungible]
  txHash: string; // base64 encoded hex - latest tx
  name: string;
}

export interface ITypeHierarchy {
  id: string; //base64 encoded hex
  parentTypeId: string; //base64 encoded hex
  symbol: string;
  decimals?: number; // [0..8] fungible only
  kind: number; //  [2:Fungible|4:NonFungible],
  txHash: string; //base64 encoded hex - creation tx
  invariantPredicate: string;
  tokenCreationPredicate: string;
  subTypeCreationPredicate: string;
  nftDataUpdatePredicate?: string; //base64 encoded hex - nft only
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

export interface IRoundNumber {
  roundNumber: string;
}

export interface INetwork {
  id: string;
  isTestNetwork: boolean;
}

export interface ISwap {
  from: string;
  top: string;
}

export interface ITransactionAttributes {
  type?: Uint8Array;
  backlink?: Uint8Array;
  newBearer?: Buffer | Uint8Array;
  remainingValue?: bigint;
  targetBearer?: Uint8Array;
  swapTimeout?: bigint;
  amount?: bigint;
  nonce?: Uint8Array | null;
  value?: bigint;
  targetValue?: bigint;
  invariantPredicateSignatures?:  (Uint8Array | null)[] | null;
  targetSystemIdentifier?: bigint; // system_identifier of the target partition (money 0000 , token 0002, vd 0003)
  targetRecordID?: Uint8Array | string; // unit id of the corresponding “add fee credit” transaction (tuleb ise luua hetkel on private key hash)
  earliestAdditionTime?: bigint; // earliest round when the corresponding “add fee credit” transaction can be executed in the target system (current round number vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
  latestAdditionTime?: bigint; // latest round when the corresponding “add fee credit” transaction can be executed in the target system (timeout vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
  ownerCondition?: Uint8Array;
  billIdentifiers?: Uint8Array[];
  proofs?: Uint8Array[];
  dcTransfers?: Uint8Array[];
  nftType?: Uint8Array;
  feeCreditOwnerCondition?: Uint8Array;
  feeCreditTransfer?: Uint8Array;
  feeCreditTransferProof?: Uint8Array;
  typeID?: Uint8Array;
  targetUnitID?: Uint8Array;
  targetUnitBacklink?: Uint8Array;
}

export interface ITransactionRequestPayload {
  transactions: ITransactionPayload[];
}

export interface ITransactionPayload {
  payload: {
    systemId: bigint;
    type: string;
    unitId: Uint8Array;
    attributes: Uint8Array | ITransactionAttributes;
    clientMetadata?: Uint8Array[] | IPayloadClientMetadata;
  };
  ownerProof?: Uint8Array;
  feeProof?: string | null;
}

export interface IPayloadClientMetadata {
  timeout?: bigint;
  MaxTransactionFee: bigint;
  feeCreditRecordID?: Uint8Array | null;
}
export interface ITransactionPayloadObj {
  systemId: bigint;
  unitId: Uint8Array;
  type: string;
  attributes: any | ITransactionAttributes;
  clientMetadata:
    | any
    | {
        timeout: bigint;
        MaxTransactionFee: bigint;
        feeCreditRecordID?: Uint8Array | null;
      };
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

export interface ITransactionPayloadProps {
  setAccounts: (e: IAccount[]) => void;
  account?: IAccount;
  accounts?: IAccount[];
  setIsActionsViewVisible: (e: boolean) => void;
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

export type IActionVies =
  | "Transfer fungible view"
  | "Transfer NFT view"
  | "Transfer Fee Credit view"
  | "Fungible list view"
  | "NFT list view"
  | "Profile view"
  | "NFT details view"
  | "";

export type INavbarViews = "fungible" | "nonFungible" | "fees";

export interface ITxOrder {
  Payload: {
    SystemID: bigint;
    Type: string;
    UnitID: string;
    Attributes: string;
    ClientMetadata: ITxClientMeta;
  };
  OwnerProof: string;
  FeeProof: string;
}

export interface ITxClientMeta {
  Timeout: number;
  MaxTransactionFee?: number;
  FeeCreditRecordID?: string;
}

export interface ITxProof {
  txRecord: Uint8Array;
  txProof: Uint8Array;
}

export interface ITxRecord {
  TransactionOrder: ITxOrder;
  ServerMetadata: {
    ActualFee: number;
    TargetUnits: null;
  };
}
export interface ITxProofObj {
  BlockHeaderHash: string;
  Chain: string[];
  UnicityCertificate: {
    input_record: {
      previous_hash: string;
      hash: string;
      block_hash: string;
      summary_value: string;
      round_number: 634504;
      sum_of_earned_fees: 142;
    };
    unicity_tree_certificate: {
      system_identifier: string;
      sibling_hashes: string[];
      system_description_hash: string;
    };
    unicity_seal: {
      root_chain_round_number: 634509;
      timestamp: 1687938038;
      hash: string;
      signatures: string[];
    };
  };
}
