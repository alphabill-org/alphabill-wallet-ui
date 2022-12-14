import { string } from "yup/lib/locale";

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
  id: string; // base64
  value: number;
  txHash: string;
  isDCBill?: boolean;
}

export interface ILockedBill {
  billId: string;
  desc: string;
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
  systemId: string;
  unitId: string;
  transactionAttributes: {
    "@type": string;
    backlink?: string;
    newBearer?: string;
    targetValue?: string;
    remainingValue?: number;
    targetBearer?: string;
    amount?: number;
    nonce?: string;
  };
  timeout: number;
  ownerProof: string;
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
  timeout: number;
  ownerProof: string;
}

export interface IProofsProps {
  bills: IProofProps[];
}

export interface IProofProps {
  id: string;
  value: number;
  txHash: string;
  txProof: ITxProof;
}

export interface ITxProof {
  blockNumber: number;
  tx: IProofTx;
  proof: IProof;
}

export interface IProofTx {
  systemId: string;
  unitId: string;
  transactionAttributes: {
    "@type": string;
    nonce: string;
    targetBearer: string;
    targetValue: number;
    backlink: string;
  };
  timeout: number;
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
  unicityCertificate: {
    inputRecord: {
      previousHash: string;
      hash: string;
      blockHash: string;
      summaryValue: string;
    };
    unicityTreeCertificate: {
      systemIdentifier: string;
      siblingHashes: string[];
      systemDescriptionHash: string;
    };
    unicitySeal: {
      rootChainRoundNumber: number;
      previousHash: string;
      hash: string;
      signatures: {
        test: string;
      };
    };
  };
}

export interface ISwapProofProps {
  proofType: "PRIM" | "SEC" | "ONLYSEC" | "NOTRANS" | "EMPTYBLOCK";
  blockHeaderHash: string;
  transactionsHash: string;
  hashValue: string;
  blockTreeHashChain: {
    items: [
      {
        val: string;
        hash: string;
      }
    ];
  };
  secTreeHashChain?: string;
  unicityCertificate: {
    inputRecord: {
      previousHash: string;
      hash: string;
      blockHash: string;
      summaryValue: string;
    };
    unicityTreeCertificate: {
      systemIdentifier: string;
      siblingHashes: string[];
      systemDescriptionHash: string;
    };
    unicitySeal: {
      rootChainRoundNumber: number;
      previousHash: string;
      hash: string;
      signatures: {
        test: string;
      };
    };
  };
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
  timeout: number;
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
  timeout: number;
  ownerProof: string;
}
