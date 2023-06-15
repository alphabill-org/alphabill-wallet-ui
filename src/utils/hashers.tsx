import * as secp from "@noble/secp256k1";
import { Uint64BE } from "int64-buffer";

import {
  ITransactionPayload,
  ITransactionAttributes,
  ITransactionPayloadObj,
} from "../types/Types";

export const NFTTransferOrderTxHash = async (tx: ITransactionPayload) => {
  const attributes = tx.payload.attributes as ITransactionAttributes;

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

export const prepTransactionRequestData = (
  data: ITransactionPayload,
  proof: Uint8Array,
  feeProof?: Uint8Array
): any => {
  let dataWithProof = data;
  dataWithProof.payload.attributes = Object.values(
    dataWithProof.payload.attributes
  );
  dataWithProof.payload.clientMetadata = Object.values(
    dataWithProof.payload.clientMetadata
  );
  const payloadValues = Object.values(dataWithProof.payload);

  return [payloadValues as any, proof, feeProof || null];
};
