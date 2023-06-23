import { string } from "yup/lib/locale";

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

export interface IFungibleAsset {
  id: string;
  name: string;
  amount: string;
  network: string;
  decimalFactor: number;
  decimals: number;
  UIAmount: string;
  typeId: string;
  isSendable: boolean;
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
}

export interface INFTTransferPayload {
  payload: {
    systemId: string;
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
      maxTransactionFee: string;
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
}

export interface IFungibleAsset {
  id: string;
  name: string;
  amount: string;
  network: string;
  decimalFactor: number;
  decimals: number;
  UIAmount: string;
  typeId: string;
  isSendable: boolean;
}

export interface IActiveAsset {
  name: string;
  typeId: string;
  id?: string;
  amount?: string;
  network?: string;
  decimalFactor?: number;
  decimals?: number;
  UIAmount?: string;
  isSendable?: boolean;
  symbol?: string;
  value?: string;
  txHash?: string;
  kind?: number;
  isDcBill?: boolean;
  nftUri?: string;
  nftData?: string;
}

export interface INonFungibleAsset {
  id: string; // base64 encoded hex
  typeId: string; // base64 encoded hex
  owner: string; // base64 encoded hex - bearer predicate
  nftUri: string; // nft only
  nftData: string; // base64 encoded hex - nft only
  kind: number; // [2:Fungible|4:NonFungible]
  txHash: string; // base64 encoded hex - latest tx
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
  isDcBill?: boolean;
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
  remainingValue?: BigInt | bigint;
  targetBearer?: Uint8Array;
  amount?: BigInt | bigint;
  nonce?: Uint8Array | null;
  value?: BigInt | bigint;
  targetValue?: BigInt | bigint;
  invariantPredicateSignatures?: Uint8Array[];
  targetSystemIdentifier?: Uint8Array; // system_identifier of the target partition (money 0000 , token 0002, vd 0003)
  targetRecordID?: Uint8Array | string; // unit id of the corresponding “add fee credit” transaction (tuleb ise luua hetkel on private key hash)
  earliestAdditionTime?: BigInt | bigint; // earliest round when the corresponding “add fee credit” transaction can be executed in the target system (current round number vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
  latestAdditionTime?: BigInt | bigint; // latest round when the corresponding “add fee credit” transaction can be executed in the target system (timeout vastavalt TargetSystemIdentifierile ehk kas token, mone ..)
  ownerCondition?: Uint8Array;
  billIdentifiers?: string[];
  proofs?: IProof[];
  dcTransfers?: ITransactionPayload[];
  nftType?: Uint8Array;
  feeCreditOwnerCondition?: Uint8Array | null;
  feeCreditTransfer?: Uint8Array | any;
  feeCreditTransferProof?: ItxProof | any[];
  typeID?: Uint8Array;
}

export interface ITransactionRequestPayload {
  transactions: ITransactionPayload[];
}

export interface ITransactionPayload {
  payload: {
    systemId: Uint8Array;
    type: string;
    unitId: Uint8Array;
    attributes: any[] | ITransactionAttributes;
    clientMetadata:
      | any[]
      | {
          timeout: BigInt | bigint;
          maxTransactionFee: BigInt | bigint;
          feeCreditRecordID?: Uint8Array | null;
        };
  };
  ownerProof?: Uint8Array;
  feeProof?: string | null;
}

export interface ITransactionPayloadObj {
  systemId: Uint8Array;
  unitId: Uint8Array;
  type: string;
  attributes: any[] | ITransactionAttributes;
  clientMetadata:
    | any[]
    | {
        timeout: BigInt | bigint;
        maxTransactionFee: BigInt | bigint;
        feeCreditRecordID?: Uint8Array | null;
      };
}

export interface IProofTx {
  payload: {
    systemId: string;
    unitId: string;
    type: string;
    attributes: {
      nonce?: string;
      targetBearer?: string;
      backlink: string;
      amount?: string;
      ownerCondition?: string;
      billIdentifiers?: string[];
      remainingValue?: string;
      proofs?: IProof[];
      dcTransfers?: IProofTx[];
      targetValue?: string;
      newBearer?: string;
      invariantPredicateSignatures?: string[];
      type?: string;
    };
    clientMetadata:
      | any[]
      | {
          timeout: string;
          maxTransactionFee: string;
          feeCreditRecordID?: Uint8Array | null;
        };
  };
  ownerProof: string;
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

export interface ISwapProps {
  payload: {
    systemId: string;
    unitId: string;
    type: string;
    attributes: {
      billIdentifiers: string[]; // All the bills that are used in a swap
      dcTransfers: ITransactionPayload[];
      ownerCondition: string;
      proofs: IProof[];
      targetValue: string;
      invariantPredicateSignatures?: string[];
    };
    clientMetadata: {
      timeout: string;
      maxTransactionFee: string;
      feeCreditRecordID?: Uint8Array | null;
    };
  };
  ownerProof: string;
}

export interface IProofsProps {
  bills: IProofProps[];
}

export interface IProofProps {
  id: string;
  value: string;
  txHash?: string;
  tx_hash?: string;
  isDcBill?: boolean;
  txProof?: ITxProof;
  tx_proof?: ITxProof;
}

export interface ITxProof {
  blockNumber: string;
  tx: ITransactionPayload;
  proof: IProof;
}

export interface IProof {
  proofType: "PRIM" | "SEC" | "ONLYSEC" | "NOTRANS" | "EMPTYBLOCK";
  blockHeaderHash: string;
  transactionsHash: string;
  hashValue: string;
  blockTreeHashChain: {
    items: { val: string; hash: string }[];
  };
  secTreeHashChain?: null;
  unicityCertificate: IUnicityCertificate;
}

export interface IInputRecord {
  previousHash: string;
  hash: string;
  blockHash: string;
  summaryValue: string;
}

export interface IUnicityCertificate {
  inputRecord: IInputRecord;
  unicityTreeCertificate: IUnicityTreeCertificate;
  unicitySeal: IUnicitySeal;
}

export interface IUnicitySeal {
  rootChainRoundNumber: string;
  previousHash: string;
  hash: string;
  signatures: {
    test: string;
  };
}

export interface IUnicityTreeCertificate {
  systemIdentifier: string;
  siblingHashes: string[];
  systemDescriptionHash: string;
}

export interface ISwapProofProps {
  proofType: "PRIM" | "SEC" | "ONLYSEC" | "NOTRANS" | "EMPTYBLOCK";
  blockHeaderHash: string;
  transactionsHash: string;
  hashValue: string;
  blockTreeHashChain: {
    items: IChainItems[];
  };
  secTreeHashChain?: string;
  unicityCertificate: {
    inputRecord: IInputRecord;
    unicityTreeCertificate: IUnicityTreeCertificate;
    unicitySeal: IUnicitySeal;
  };
}

export interface IChainItems {
  val: string;
  hash: string;
}
export interface IFeeCreditBills {
  alpha: any;
  tokens: any;
}
export interface IDCTransferProps {
  payload: {
    systemId: string;
    unitId: string;
    type: string;
    attributes: {
      backlink: string;
      nonce: string;
      targetBearer: string;
      targetValue: string;
    };
    clientMetadata: {
      timeout: string;
      maxTransactionFee: string;
      feeCreditRecordID?: Uint8Array | null;
    };
  };
  ownerProof: string;
}

export interface IBalance {
  balance: number;
  pubKey: string;
}

export interface ItxRecord {
  TransactionOrder: {
    Payload: {
      SystemID: string;
      Type: string;
      UnitID: string;
      Attributes: string | Buffer[] | ITransactionAttributes;
      ClientMetadata:
        | string | Buffer[]
        | {
            Timeout: number;
            MaxTransactionFee: number;
            FeeCreditRecordID: string | null;
          };
    };
    OwnerProof: string;
    FeeProof: string | null;
  };
  ServerMetadata: {
    ActualFee: 1;
    TargetUnits: null;
  };
}

export interface ItxProof {
  BlockHeaderHash: string;
  Chain: [];
  UnicityCertificate: {
    input_record: ItxProofInputRecord;
    unicity_tree_certificate: ItxProofUnicityTreeCert;
    unicity_seal: ItxProofUnicitySeal;
  };
}
export interface ItxProofInputRecord {
  previous_hash: string;
  hash: string;
  block_hash: string;
  summary_value: string;
  round_number: number;
  sum_of_earned_fees: number;
}

export interface ItxProofUnicityTreeCert {
  system_identifier: string;
  sibling_hashes: string[];
  system_description_hash: string;
}
export interface ItxProofUnicitySeal {
  root_chain_round_number: number;
  timestamp: number;
  hash: string;
  signatures: {
    test: string;
  };
}

export type IActionVies =
  | "Transfer fungible view"
  | "Transfer NFT view"
  | "Add Fee Credit view"
  | "Fungible list view"
  | "NFT list view"
  | "Profile view"
  | "NFT details view"
  | "";

export type INavbarViews = "fungible" | "nonFungible" | "fees";
