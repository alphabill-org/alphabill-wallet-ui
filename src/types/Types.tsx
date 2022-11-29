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
  id: string;
  value: number;
  txHash: string;
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
  system_id: string;
  unit_id: string;
  type: string;
  attributes: {
    backlink?: string;
    new_bearer?: string;
    target_value?: number;
    remaining_value?: number;
    target_bearer?: string;
    amount?: number;
    nonce?: string;
  };
  timeout: number;
  owner_proof: string;
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
  system_id: string;
  unit_id: string;
  type: string;
  attributes: {
    bill_identifiers: string[]; // All the bills that are used in a swap
    dc_transfers: ITransfer[];
    owner_condition: string;
    proofs: [
      {
        proof_type: "PRIM" | "SEC" | "ONLYSEC" | "NOTRANS" | "EMPTYBLOCK";
        block_header_hash: string;
        transactions_hash: string;
        hash_value: string;
        block_tree_hash_chain: {
          items: [
            {
              val: string;
              hash: string;
            }
          ];
        };
        unicity_certificate: {
          input_record: {
            previous_hash: string;
            hash: string;
            block_hash: string;
            summary_value: string;
          };
          unicity_tree_certificate: {
            system_identifier: string;
            sibling_hashes: string[];

            system_description_hash: string;
          };
          unicity_seal: {
            root_chain_round_number: 1;
            previous_hash: string;
            hash: string;
            signatures: {
              test: string;
            };
          };
        };
      }
    ];
    target_value: number;
  };
  timeout: number;
  owner_proof: string;
}

export interface IProofProps {
  id: string;
  value: number;
  txHash: string;
  txProof: {
    blockNumber: number;
    tx: {
      systemId: string;
      unitId: string;
      transactionAttributes: {
        "@type": string;
        amount: number;
        targetBearer: string;
        remainingValue: number;
        backlink: string;
      };
    };
    timeout: number;
    ownerProof: string;
  };
  proof: {
    block_header_hash: string;
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
        rootChainRoundNumber: 1;
        previousHash: string;
        hash: string;
        signatures: any;
      };
    };
  };
}
