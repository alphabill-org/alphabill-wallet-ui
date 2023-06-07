import * as secp from "@noble/secp256k1";
import { Uint64BE } from "int64-buffer";

import {
  IBill,
  IInputRecord,
  INFTTransferPayload,
  IProof,
  IProofTx,
  ISwapProps,
  ITransfer,
} from "../types/Types";
import {
  AlphaDcType,
  AlphaSplitType,
  AlphaTransferType,
  TokensTransferType,
} from "./constants";

export const baseBufferProof = (tx: IProofTx | ISwapProps) =>
  secp.utils.concatBytes(
    Buffer.from(tx.payload.systemId, "base64"),
    Buffer.from(tx.payload.unitId, "base64"),
    Buffer.from(tx.ownerProof, "base64"),
  );

export const baseBuffer = (tx: IProofTx | ISwapProps) =>
  secp.utils.concatBytes(
    Buffer.from(tx.payload.systemId, "base64"),
    Buffer.from(tx.payload.unitId, "base64"),
    Buffer.from(tx.ownerProof, "base64"),
  );

export const dcTransfersBuffer = (
  dcTransfers: IProofTx[],
  isProof?: boolean
) => {
  return Buffer.concat(
    dcTransfers!.map((tx: IProofTx) => {
      const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);
      return Buffer.concat([transferBaseBuffer, dcAttributesBuffer(tx)]);
    })
  );
};

export const inputRecordBuffer = (inputRecord: IInputRecord) =>
  secp.utils.concatBytes(
    Buffer.from(inputRecord.previousHash, "base64"),
    Buffer.from(inputRecord.hash, "base64"),
    Buffer.from(inputRecord.blockHash, "base64"),
    Buffer.from(inputRecord.summaryValue, "base64")
  );

export const swapProofsBuffer = (proofs: IProof[]) =>
  Buffer.concat(
    proofs?.map((p: IProof) => {
      const chainItems = p.blockTreeHashChain.items.map((i) =>
        Buffer.concat([
          Buffer.from(i.val, "base64"),
          Buffer.from(i.hash, "base64"),
        ])
      );
      const treeHashes =
        p.unicityCertificate.unicityTreeCertificate.siblingHashes.map((i) =>
          Buffer.from(i, "base64")
        );

      return Buffer.concat([
        Buffer.alloc(4),
        Buffer.from(p.blockHeaderHash, "base64"),
        Buffer.from(p.transactionsHash, "base64"),
        Buffer.from(p.hashValue, "base64"),
        Buffer.concat(chainItems),
        inputRecordBuffer(p.unicityCertificate.inputRecord),
        Buffer.from(
          p.unicityCertificate.unicityTreeCertificate.systemIdentifier,
          "base64"
        ),
        Buffer.from(
          p.unicityCertificate.unicityTreeCertificate.systemDescriptionHash,
          "base64"
        ),
        Buffer.concat(treeHashes),
        new Uint64BE(
          p.unicityCertificate.unicitySeal.rootChainRoundNumber
        ).toBuffer(),
        Buffer.from(p.unicityCertificate.unicitySeal.previousHash, "base64"),
        Buffer.from(p.unicityCertificate.unicitySeal.hash, "base64"),
      ]);
    })
  );

export const identifiersBuffer = (billIdentifiers: string[]) =>
  Buffer.concat(billIdentifiers.map((i) => Buffer.from(i, "base64")));

export const transferAttributesBuffer = (tx: ITransfer) => {
  const transferField =
    tx.payload.type === AlphaTransferType
      ? "targetValue"
      : "value";

  let bytes = secp.utils.concatBytes(
    Buffer.from(tx.payload.transactionAttributes.newBearer as string, "base64"),
    new Uint64BE(tx.payload.transactionAttributes[transferField]!).toBuffer(),
    Buffer.from(tx.payload.transactionAttributes.backlink!, "base64")
  );

  if (tx.payload.type === TokensTransferType) {
    bytes = secp.utils.concatBytes(
      bytes,
      Buffer.from(tx.payload.transactionAttributes?.type!, "base64")
    );
  }
  return bytes;
};

export const splitAttributesBuffer = (tx: any) => {
  let bytes;

  if (tx.payload.type === AlphaSplitType) {
    bytes = secp.utils.concatBytes(
      new Uint64BE(tx.payload.transactionAttributes.amount).toBuffer(),
      Buffer.from(tx.payload.transactionAttributes.targetBearer as string, "base64"),
      new Uint64BE(tx.payload.transactionAttributes.remainingValue).toBuffer(),
      Buffer.from(tx.payload.transactionAttributes.backlink!, "base64")
    );
  } else {
    bytes = secp.utils.concatBytes(
      Buffer.from(tx.payload.transactionAttributes.newBearer as string, "base64"),
      new Uint64BE(tx.payload.transactionAttributes.targetValue).toBuffer(),
      new Uint64BE(tx.payload.transactionAttributes.remainingValue).toBuffer(),
      Buffer.from(tx.payload.transactionAttributes.backlink!, "base64"),
      Buffer.from(tx.payload.transactionAttributes.type, "base64")
    );
  }

  return bytes;
};

export const dcAttributesBuffer = (tx: IProofTx | ITransfer) =>
  secp.utils.concatBytes(
    Buffer.from(tx.payload.transactionAttributes.nonce!, "base64"),
    Buffer.from(tx.payload.transactionAttributes.targetBearer as string, "base64"),
    new Uint64BE(tx.payload.transactionAttributes.targetValue!).toBuffer(),
    Buffer.from(tx.payload.transactionAttributes.backlink!, "base64")
  );

export const swapAttributesBuffer = (
  tx: IProofTx | ISwapProps,
  isProof?: boolean
) =>
  secp.utils.concatBytes(
    Buffer.from(tx.payload.transactionAttributes.ownerCondition!, "base64"),
    identifiersBuffer(tx.payload.transactionAttributes.billIdentifiers!),
    dcTransfersBuffer(tx.payload.transactionAttributes.dcTransfers!, isProof),
    swapProofsBuffer(tx.payload.transactionAttributes?.proofs!),
    new Uint64BE(tx.payload.transactionAttributes.targetValue!).toBuffer()
  );

export const transferOrderHash = async (tx: IProofTx, isProof?: boolean) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);
  return await secp.utils.sha256(
    secp.utils.concatBytes(transferBaseBuffer, transferAttributesBuffer(tx))
  );
};

export const NFTTransferOrderHash = async (
  tx: INFTTransferPayload,
  isProof?: boolean
) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);
  return await secp.utils.sha256(
    secp.utils.concatBytes(
      transferBaseBuffer,
      Buffer.from(tx.payload.transactionAttributes.newBearer as string, "base64"),
      Buffer.from(tx.payload.transactionAttributes.backlink!, "base64"),
      Buffer.from(tx.payload.transactionAttributes?.nftType!, "base64")
    )
  );
};

export const NFTTransferOrderTxHash = async (
  tx: INFTTransferPayload,
) => {
  const signatures =
    tx.payload.transactionAttributes?.invariantPredicateSignatures!.map((s) =>
      Buffer.from(s, "base64")
    );

  return Buffer.from(
    await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(tx.payload.systemId, "base64"),
        Buffer.from(tx.payload.unitId, "base64"),
        Buffer.from(tx.ownerProof, "base64"),
        Buffer.from(tx.payload.transactionAttributes.newBearer as string, "base64"),
        Buffer.from(tx.payload.transactionAttributes.backlink!, "base64"),
        Buffer.concat(signatures),
        Buffer.from(tx.payload.transactionAttributes?.nftType!, "base64")
      )
    )
  ).toString("base64");
};

export const splitOrderHash = async (tx: IProofTx, isProof?: boolean) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);
  return await secp.utils.sha256(
    secp.utils.concatBytes(transferBaseBuffer, splitAttributesBuffer(tx))
  );
};

export const swapOrderHash = async (tx: ISwapProps, isProof?: boolean) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);

  return await secp.utils.sha256(
    secp.utils.concatBytes(
      transferBaseBuffer,
      swapAttributesBuffer(tx, isProof)
    )
  );
};

export const dcOrderHash = async (
  tx: ITransfer,
  bill: IBill,
  nonceHash: Uint8Array
) => {
  if (tx.payload.type === AlphaDcType) {
    return await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(tx.payload.systemId, "base64"),
        Buffer.from(tx.payload.unitId, "base64"),
        Buffer.from(Buffer.from(nonceHash).toString("base64"), "base64"),
        Buffer.from(tx.payload.transactionAttributes.targetBearer as string, "base64"),
        new Uint64BE(bill.value).toBuffer(),
        Buffer.from(bill.txHash, "base64")
      )
    );
  } else {
    return await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(tx.payload.systemId, "base64"),
        Buffer.from(tx.payload.unitId, "base64"),
        Buffer.from(Buffer.from(nonceHash).toString("base64"), "base64"),
        new Uint64BE(bill.value).toBuffer(),
        Buffer.from(bill.txHash, "base64")
      )
    );
  }
};

export const privateKeyHash = async (key: Uint8Array) => {
  return await secp.utils.sha256(key);
};