import * as secp from "@noble/secp256k1";
import { Uint64BE } from "int64-buffer";

import {
  IBill,
  IInputRecord,
  IProof,
  IProofTx,
  ISwapProps,
  ITransfer,
} from "../types/Types";
import { ALPHADcType, ALPHASplitType, TOKENSSplitType } from "./utils";

export const baseBufferProof = (tx: IProofTx | ISwapProps) =>
  secp.utils.concatBytes(
    Buffer.from(tx.systemId, "base64"),
    Buffer.from(tx.unitId, "base64"),
    Buffer.from(tx.ownerProof, "base64"),
    new Uint64BE(Number(tx.timeout)).toBuffer()
  );

export const baseBuffer = (tx: IProofTx | ISwapProps) =>
  secp.utils.concatBytes(
    Buffer.from(tx.systemId, "base64"),
    Buffer.from(tx.unitId, "base64"),
    Buffer.from(tx.ownerProof, "base64"),
    new Uint64BE(Number(tx.timeout)).toBuffer()
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
    proofs.map((p: IProof) => {
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

export const transferAttributesBuffer = (tx: any) => {
  let transferField = "value";
  let bytes = secp.utils.concatBytes(
    Buffer.from(tx.transactionAttributes.newBearer as string, "base64"),
    new Uint64BE(Number(tx.transactionAttributes[transferField])).toBuffer(),
    Buffer.from(tx.transactionAttributes.backlink, "base64"),
    Buffer.from(tx.transactionAttributes.invariantPredicateSignatures, "base64")
  );
  if (
    tx.transactionAttributes["@type"] ===
    "type.googleapis.com/rpc.TransferOrder"
  ) {
    transferField = "targetValue";
  } else {
    bytes = secp.utils.concatBytes(
      bytes,
      Buffer.from(
        tx.transactionAttributes.invariantPredicateSignatures,
        "base64"
      )
    );
  }

  return bytes;
};

export const splitAttributesBuffer = (tx: any) => {
  let amountField: string = "targetValue";
  let bearerField: string = "newBearer";

  if (tx.transactionAttributes["@type"] === ALPHASplitType) {
    amountField = "amount";
    bearerField = "targetBearer";
  } else {
  }
  let bytes = secp.utils.concatBytes(
    new Uint64BE(Number(tx.transactionAttributes[amountField])).toBuffer(),
    Buffer.from(tx.transactionAttributes[bearerField] as string, "base64"),
    new Uint64BE(Number(tx.transactionAttributes.remainingValue)).toBuffer(),
    Buffer.from(tx.transactionAttributes.backlink!, "base64")
  );

  if (tx.transactionAttributes["@type"] === TOKENSSplitType) {
    bytes = secp.utils.concatBytes(
      Buffer.from(tx.transactionAttributes.type, "base64"),
      bytes,
      Buffer.from(
        tx.transactionAttributes.invariantPredicateSignatures,
        "base64"
      )
    );
  }

  return bytes;
};

export const dcAttributesBuffer = (tx: IProofTx | ITransfer) =>
  secp.utils.concatBytes(
    Buffer.from(tx.transactionAttributes.nonce!, "base64"),
    Buffer.from(tx.transactionAttributes.targetBearer as string, "base64"),
    new Uint64BE(Number(tx.transactionAttributes.targetValue!)).toBuffer(),
    Buffer.from(tx.transactionAttributes.backlink!, "base64")
  );

export const swapAttributesBuffer = (
  tx: IProofTx | ISwapProps,
  isProof?: boolean
) =>
  secp.utils.concatBytes(
    Buffer.from(tx.transactionAttributes.ownerCondition!, "base64"),
    identifiersBuffer(tx.transactionAttributes.billIdentifiers!),
    dcTransfersBuffer(tx.transactionAttributes.dcTransfers!, isProof),
    swapProofsBuffer(tx.transactionAttributes?.proofs!),
    new Uint64BE(Number(tx.transactionAttributes.targetValue)).toBuffer()
  );

export const transferOrderHash = async (tx: IProofTx, isProof?: boolean) => {
  const transferBaseBuffer = isProof ? baseBufferProof(tx) : baseBuffer(tx);
  return await secp.utils.sha256(
    secp.utils.concatBytes(transferBaseBuffer, transferAttributesBuffer(tx))
  );
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
  if (tx.transactionAttributes["@type"] === ALPHADcType) {
    return await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(tx.systemId, "base64"),
        Buffer.from(tx.unitId, "base64"),
        new Uint64BE(tx.timeout).toBuffer(),
        Buffer.from(Buffer.from(nonceHash).toString("base64"), "base64"),
        Buffer.from(tx.transactionAttributes.targetBearer as string, "base64"),
        new Uint64BE(bill.value).toBuffer(),
        Buffer.from(bill.txHash, "base64")
      )
    );
  } else {
    return await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(tx.systemId, "base64"),
        Buffer.from(tx.unitId, "base64"),
        new Uint64BE(tx.timeout).toBuffer(),
        Buffer.from(Buffer.from(nonceHash).toString("base64"), "base64"),
        new Uint64BE(bill.value).toBuffer(),
        Buffer.from(bill.txHash, "base64")
      )
    );
  }
};
