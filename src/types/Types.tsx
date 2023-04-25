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
  value: string;
  isDcBill?: boolean;
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
  systemId: string;
  unitId: string;
  transactionAttributes: {
    "@type": string;
    nftType: string;
    backlink: string;
    newBearer?: string;
    invariantPredicateSignatures?: string[];
  };
  timeout: string;
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
  isImageUrl?: boolean; // nft only
  downloadableItemType?: string | null;
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
  decimals?: number;
  isDcBill?: boolean;
  isImageUrl?: boolean;
  downloadableItemType?: string | null;
  nftUri?: string;
  nftData?: string;
}

export interface INonFungibleAsset {
  id: string; // base64 encoded hex
  typeId: string; // base64 encoded hex
  owner: string; // base64 encoded hex - bearer predicate
  nftUri: string; // nft only
  isImageUrl?: boolean; // nft only
  downloadableItemType?: string | null;
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

export interface IBlockStats {
  blockHeight: string;
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
  systemId: string;
  unitId: string;
  transactionAttributes: {
    "@type": string;
    type?: string;
    backlink?: string;
    newBearer?: string;
    remainingValue?: string;
    targetBearer?: string;
    amount?: string;
    nonce?: string;
    value?: string;
    targetValue?: string;
    invariantPredicateSignatures?: string[];
  };
  timeout: string;
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

export interface ITransferProps {
  setAccounts: (e: IAccount[]) => void;
  account?: IAccount;
  accounts?: IAccount[];
  setIsActionsViewVisible: (e: boolean) => void;
}

export interface ISwapProps {
  systemId: string;
  unitId: string;
  transactionAttributes: {
    "@type": string;
    billIdentifiers: string[]; // All the bills that are used in a swap
    dcTransfers: IProofTx[];
    ownerCondition: string;
    proofs: IProof[];
    targetValue: string;
    invariantPredicateSignatures?: string[];
  };
  timeout: string;
  ownerProof: string;
}

export interface IProofsProps {
  bills: IProofProps[];
}

export interface IProofProps {
  id: string;
  value: string;
  txHash: string;
  isDcBill?: boolean;
  txProof: ITxProof;
}

export interface ITxProof {
  blockNumber: string;
  tx: IProofTx;
  proof: IProof;
}

export interface IProofTx {
  systemId: string;
  unitId: string;
  transactionAttributes: {
    "@type": string;
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
  timeout: string;
  ownerProof: string;
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

export interface ISwapTransferProps {
  systemId: string;
  unitId: string;
  transactionAttributes: {
    "@type": string;
    billIdentifiers: string[];
    dcTransfers: IProofTx[];
    ownerCondition: string;
    proofs: IProof[];
    targetValue: string;
    invariantPredicateSignatures?: string[];
  };
  timeout: string;
  ownerProof: string;
}

export interface IDCTransferProps {
  systemId: string;
  unitId: string;
  transactionAttributes: {
    "@type": string;
    backlink: string;
    nonce: string;
    targetBearer: string;
    targetValue: string;
  };
  timeout: string;
  ownerProof: string;
}

export interface IBalance {
  balance: number;
  pubKey: string;
}

export type IActionVies =
  | "Transfer fungible view"
  | "Transfer NFT view"
  | "Fungible list view"
  | "NFT list view"
  | "Profile view"
  | "NFT details view"
  | "";
