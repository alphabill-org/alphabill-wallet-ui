import * as secp from "@noble/secp256k1";
import { encodeCanonical } from "cbor";
import { Uint64BE } from "int64-buffer";
import { decode } from "cbor";

import {
  ITransactionPayload,
  ItxProof,
  ItxRecord,
} from "../types/Types";
import {
  AlphaDcType,
  AlphaSplitType,
  AlphaSwapType,
  AlphaTransferType,
  FeeCreditAddType,
  FeeCreditCloseType,
  FeeCreditReclaimType,
  FeeCreditTransferType,
  NFTTokensTransferType,
  TokensSplitType,
  TokensTransferType,
} from "./constants";

export const transferOrderTxHash = async (tx: Uint8Array[]) => {
  return Buffer.from(await secp.utils.sha256(encodeCanonical(tx))).toString(
    "base64"
  );
};

export const publicKeyHash = async (key: string, asHexString?: boolean) => {
  const checkedKey = key.startsWith("0x") ? key.substring(2) : key;
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
  dataWithProof.payload.attributes = Object.values(
    dataWithProof.payload.attributes
  );
  dataWithProof.payload.clientMetadata = Object.values(
    dataWithProof.payload.clientMetadata
  );
  const payloadValues = Object.values(dataWithProof.payload);

  return [payloadValues as any, proof, feeProof || null];
};

export const getTxRecordValues = (txRecord: ItxRecord) => {
  let payload = txRecord.TransactionOrder.Payload;
  payload.ClientMetadata = Object.values(
    txRecord.TransactionOrder.Payload.ClientMetadata
  );
  payload.Attributes = Object.values(
    txRecord.TransactionOrder.Payload.Attributes
  );

  return Object.values({
    TransactionOrder: Object.values({
      Payload: Object.values(payload),
      OwnerProof: txRecord.TransactionOrder.OwnerProof,
      FeeProof: null,
    }),
    ServerMetadata: Object.values(txRecord.ServerMetadata),
  });
};

export const getTxProofValues = (txProof: ItxProof) => {
  return Object.values({
    BlockHeaderHash: txProof.BlockHeaderHash,
    Chain: Object.values(txProof.Chain),
    UnicityCertificate: Object.values({
      input_record: Object.values(txProof.UnicityCertificate.input_record),
      unicity_tree_certificate: Object.values(
        txProof.UnicityCertificate.unicity_tree_certificate
      ),
      unicity_seal: Object.values(txProof.UnicityCertificate.unicity_seal),
    }),
  });
};

export const createConcatenatedBuffer = (obj: any): Buffer | null => {
  if (!obj) {
    return null;
  }
  const bufferArray: any = [];
  if (obj instanceof Buffer) {
    return bufferArray;
  } else {
    Object?.values(obj)?.forEach((value: any) => {
      if (typeof value === "string") {
        bufferArray.push(Buffer.from(value, "base64"));
      } else if (typeof value === "number" || typeof value === "bigint") {
        bufferArray.push(new Uint64BE(value.toString()).toBuffer());
      } else if (value instanceof Buffer) {
        bufferArray.push(value);
      }
      // Add additional conditions for other value types if needed.
    });

    return Buffer.concat(bufferArray);
  }
};

export const bufferizeObject = (obj: any): Uint8Array[] => {
  const bufferedObj = { ...obj };

  const convertValueToBuffer = (value: any): any => {
    if (Array.isArray(value)) {
      if (value.length < 1) return null;
      return value.map((elem: any) => convertValueToBuffer(elem));
    } else if (typeof value === "object") {
      return Object.values(bufferizeObject(value));
    } else if (
      typeof value === "string" &&
      ![
        AlphaSplitType,
        AlphaTransferType,
        AlphaSwapType,
        AlphaDcType,
        TokensSplitType,
        TokensTransferType,
        NFTTokensTransferType,
        FeeCreditAddType,
        FeeCreditTransferType,
        FeeCreditCloseType,
        FeeCreditReclaimType,
      ].includes(value)
    ) {
      return Buffer.from(value, "base64");
    } else if (typeof value === "number" || typeof value === "bigint") {
      return BigInt(value);
    }
    return value;
  };

  for (const key in bufferedObj) {
    if (bufferedObj.hasOwnProperty(key)) {
      const value = bufferedObj[key];

      if (key === "Attributes") {
        bufferedObj[key] = decode(Buffer.from(value, "base64"));
      } else if (key === "signatures") {
        bufferedObj[key] = new Map([
          [
            Object.keys(value)[0],
            Buffer.from(value[Object.keys(value)[0]], "base64"),
          ],
        ]);
      } else {
        bufferedObj[key] = value && convertValueToBuffer(value);
      }
    }
  }

  return Object.values(bufferedObj);
};
