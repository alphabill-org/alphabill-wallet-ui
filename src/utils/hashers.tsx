import * as secp from "@noble/secp256k1";
import { encodeCanonical } from "cbor";

import { ITransactionPayload } from "../types/Types";
import {
  moneyFeeCreditRecordUnitType,
  tokenFeeCreditRecordUnitType,
} from "./constants";

export const transferOrderTxHash = async (tx: Uint8Array[]) => {
  return Buffer.from(await secp.utils.sha256(encodeCanonical(tx))).toString(
    "base64"
  );
};

export const publicKeyHashWithFeeType = async ({
  key,
  asHexString,
  isAlpha,
}: {
  key: string;
  asHexString?: boolean;
  isAlpha: boolean;
}) => {
  if (!key) return "";

  const checkedKey = key?.startsWith("0x") ? key.substring(2) : key;
  const keyHash = Buffer.from(checkedKey, "hex");
  const hash = await secp.utils.sha256(keyHash);
  const hashWithType =
    Buffer.from(hash).toString("hex") +
    (isAlpha ? moneyFeeCreditRecordUnitType : tokenFeeCreditRecordUnitType);

  if (asHexString) {
    return ("0x" + hashWithType) as string;
  }

  return Buffer.from(hashWithType, "hex") as Uint8Array;
};

export const publicKeyHash = async (key: string, asHexString?: boolean) => {
  if (!key) return "";

  const checkedKey = key?.startsWith("0x") ? key.substring(2) : key;
  const keyHash = Buffer.from(checkedKey, "hex");
  const hash = Buffer.from(await secp.utils.sha256(keyHash));

  if (asHexString) {
    return ("0x" + hash.toString("hex")) as string;
  }

  return hash as Uint8Array;
};

export const prepTransactionRequestData = (
  data: ITransactionPayload,
  proof?: Uint8Array | null,
  feeProof?: Uint8Array | null
): Uint8Array[] => {
  let dataWithProof = data;
  (dataWithProof.payload.attributes as Uint8Array[]) = Object.values(
    dataWithProof.payload.attributes
  );
  (dataWithProof.payload!.clientMetadata as Uint8Array[]) = Object.values(
    dataWithProof.payload.clientMetadata!
  );

  const payloadValues = Object.values(dataWithProof.payload);

  return [payloadValues as any, proof, feeProof || null];
};
