import * as secp from "@noble/secp256k1";
import { Uint64BE } from "int64-buffer";

import {
  ITransactionPayload,
  ITransactionAttributes,
} from "../types/Types";

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

export const publicKeyHash = async (key: Uint8Array, asHexString?: boolean) => {
  const hash = await secp.utils.sha256(key);

  if (asHexString) {
    const hexString = Array.from(hash)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return ("0x" + hexString) as string;
  }

  return hash as Uint8Array;
};
