import * as secp from "@noble/secp256k1";
import { Uint64BE } from "int64-buffer";

import {
  IBill,
  IInputRecord,
  INFTTransferPayload,
  IProof,
  ITransactionPayload,
  ISwapProps,
  ITransactionAttributes,
  IProofTx,
} from "../types/Types";
import {
  AlphaDcType,
  AlphaSplitType,
  AlphaTransferType,
  TokensTransferType,
} from "./constants";

export const baseBufferProof = (tx: ITransactionPayload) =>
  secp.utils.concatBytes(
    tx.payload.systemId,
    tx.payload.unitId,
    tx.ownerProof!
  );

export const baseBuffer = (tx: ITransactionPayload) =>
  secp.utils.concatBytes(
    tx.payload.systemId,
    tx.payload.unitId,
    tx.ownerProof!
  );

export const dcTransfersBuffer = (
  dcTransfers: ITransactionPayload[],
  isProof?: boolean
) => {
  return Buffer.concat(
    dcTransfers!.map((tx: ITransactionPayload) => {
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

export const transferAttributesBuffer = (tx: ITransactionPayload) => {
  const transferField =
    Buffer.from(tx.payload.type).toString("base64") === AlphaTransferType
      ? "targetValue"
      : "value";
  const attributes = tx.payload.transactionAttributes as ITransactionAttributes;
  let bytes = secp.utils.concatBytes(
    attributes.newBearer!,
    new Uint64BE(attributes[transferField]?.toString()!).toBuffer(),
    attributes.backlink!
  );

  if (Buffer.from(tx.payload.type).toString("base64") === TokensTransferType) {
    bytes = secp.utils.concatBytes(bytes, attributes?.type!);
  }
  return bytes;
};

export const splitAttributesBuffer = (tx: any) => {
  let bytes;
  const attributes = tx.payload.transactionAttributes as ITransactionAttributes;
  if (tx.payload.type === AlphaSplitType) {
    bytes = secp.utils.concatBytes(
      new Uint64BE(attributes.amount!.toString()).toBuffer(),

      attributes.targetBearer!,
      new Uint64BE(attributes.remainingValue!.toString()).toBuffer(),
      attributes.backlink!
    );
  } else {
    bytes = secp.utils.concatBytes(
      attributes.newBearer!,
      new Uint64BE(attributes.targetValue!.toString()).toBuffer(),
      new Uint64BE(attributes.remainingValue!.toString()).toBuffer(),
      attributes.backlink!,
      attributes.type!
    );
  }

  return bytes;
};

export const dcAttributesBuffer = (
  tx: ITransactionPayload | ITransactionPayload
) => {
  const attributes = tx.payload.transactionAttributes as ITransactionAttributes;
  return secp.utils.concatBytes(
    attributes.nonce!,
    attributes.targetBearer!,
    new Uint64BE(attributes.targetValue!.toString()).toBuffer(),
    attributes.backlink!
  );
};

export const swapAttributesBuffer = (
  tx: ITransactionPayload | ISwapProps,
  isProof?: boolean
) => {
  const attributes = tx.payload.transactionAttributes as ITransactionAttributes;
  return secp.utils.concatBytes(
    attributes.ownerCondition!,
    identifiersBuffer(attributes.billIdentifiers!),
    dcTransfersBuffer(attributes.dcTransfers!, isProof),
    swapProofsBuffer(attributes?.proofs!),
    new Uint64BE(attributes.targetValue!.toString()).toBuffer()
  );
};

export const transferOrderHash = async (
  tx: ITransactionPayload,
  isProof?: boolean
) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);
  return await secp.utils.sha256(
    secp.utils.concatBytes(transferBaseBuffer, transferAttributesBuffer(tx))
  );
};

export const NFTTransferOrderHash = async (
  tx: ITransactionPayload,
  isProof?: boolean
) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);
  const attributes = tx.payload.transactionAttributes as ITransactionAttributes;
  return await secp.utils.sha256(
    secp.utils.concatBytes(
      transferBaseBuffer,

      attributes.newBearer!,
      attributes.backlink!,
      attributes?.nftType!
    )
  );
};

export const NFTTransferOrderTxHash = async (tx: ITransactionPayload) => {
  const attributes = tx.payload.transactionAttributes as ITransactionAttributes;

  return Buffer.from(
    await secp.utils.sha256(
      secp.utils.concatBytes(
        tx.payload.systemId,
        tx.payload.unitId,
        tx.ownerProof!,
        attributes.newBearer!,
        attributes.backlink!,
        attributes.invariantPredicateSignatures!,
        attributes?.nftType!
      )
    )
  ).toString("base64");
};

export const splitOrderHash = async (
  tx: ITransactionPayload,
  isProof?: boolean
) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);
  return await secp.utils.sha256(
    secp.utils.concatBytes(transferBaseBuffer, splitAttributesBuffer(tx))
  );
};

export const swapOrderHash = async (
  tx: ITransactionPayload,
  isProof?: boolean
) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);

  return await secp.utils.sha256(
    secp.utils.concatBytes(
      transferBaseBuffer,
      swapAttributesBuffer(tx, isProof)
    )
  );
};

export const dcOrderHash = async (
  tx: ITransactionPayload,
  bill: IBill,
  nonceHash: Uint8Array
) => {
  if (Buffer.from(tx.payload.type).toString("base64") === AlphaDcType) {
    return await secp.utils.sha256(
      secp.utils.concatBytes(
        tx.payload.systemId,
        tx.payload.unitId,
        nonceHash,
        (tx.payload.transactionAttributes as ITransactionAttributes)
          .targetBearer!,
        new Uint64BE(bill.value).toBuffer(),
        Buffer.from(bill.txHash, "base64")
      )
    );
  } else {
    return await secp.utils.sha256(
      secp.utils.concatBytes(
        tx.payload.systemId,
        tx.payload.unitId,
        Buffer.from(nonceHash),
        new Uint64BE(bill.value).toBuffer(),
        Buffer.from(bill.txHash, "base64")
      )
    );
  }
};

export const publicKeyHash = async (key: Uint8Array) => {
  return await secp.utils.sha256(key);
};
