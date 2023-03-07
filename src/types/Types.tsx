import { string } from "yup/lib/locale";

export interface IAccount {
  pubKey: string;
  name: string;
  balance?: string;
  assets: IAsset[];
  activities: IActivity[];
  activeNetwork?: string;
  networks: INetwork[];
  idx?: number | string;
}

export interface IAsset {
  id: string;
  name: string;
  amount: string;
  network: string;
  decimalFactor: number;
  decimalPlaces: number;
  UIAmount: string;
}

export interface IBill {
  id: string; // base64
  value: string;
  txHash: string;
  isDcBill?: boolean;
}

export interface ILockedBill {
  billId: string;
  desc: string;
  value: string;
}

export interface IBillsList {
  total: number;
  bills: IBill[];
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
    backlink?: string;
    newBearer?: string;
    targetValue?: string;
    remainingValue?: string;
    targetBearer?: string;
    amount?: string;
    nonce?: string;
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
  type: "Buy" | "Send" | "Swap" | "Receive";
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
    targetValue?: string;
    backlink: string;
    newBearer?: string;
    amount?: string;
    ownerCondition?: string;
    billIdentifiers?: string[];
    remainingValue?: string;
    proofs?: IProof[];
    dcTransfers?: IProofTx[];
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
  rootChainRoundNumber: number;
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
