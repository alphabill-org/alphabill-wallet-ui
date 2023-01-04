import { useEffect, useRef } from "react";
import { getIn } from "formik";
import CryptoJS from "crypto-js";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";
import { uniq } from "lodash";
import * as secp from "@noble/secp256k1";
import { Uint64BE } from "int64-buffer";

import {
  IAccount,
  IBill,
  IProof,
  IProofProps,
  IProofTx,
  ITransfer,
  ITxProof,
} from "../types/Types";

export const extractFormikError = (
  errors: unknown,
  touched: unknown,
  names: string[]
): string =>
  names
    .map((name) => {
      const error = getIn(errors, name);
      const touch = getIn(touched, name);

      if (!error || !touch || typeof error !== "string") {
        return "";
      }

      return !!(error && touch) ? error : "";
    })
    .find((error) => !!error) || "";

export function useCombinedRefs(...refs: any[]) {
  const targetRef = useRef();

  useEffect(() => {
    refs.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === "function") {
        ref(targetRef.current);
      } else {
        ref.current = targetRef.current;
      }
    });
  }, [refs]);

  return targetRef;
}

export const unit8ToHexPrefixed = (key: Uint8Array) =>
  "0x" + Buffer.from(key).toString("hex");

export const base64ToHexPrefixed = (key: string = "") =>
  "0x" + Buffer.from(key, "base64").toString("hex");

export const sortBillsByID = (bills: IBill[]) =>
  uniq(bills).sort((a: IBill, b: IBill) =>
    BigInt(base64ToHexPrefixed(a.id)) < BigInt(base64ToHexPrefixed(b.id))
      ? -1
      : BigInt(base64ToHexPrefixed(a.id)) > BigInt(base64ToHexPrefixed(b.id))
      ? 1
      : 0
  );

export const sortTxProofsByID = (transfers: ITxProof[]) =>
  transfers.sort((a: ITxProof, b: ITxProof) =>
    BigInt(base64ToHexPrefixed(a.tx.unitId)) <
    BigInt(base64ToHexPrefixed(b.tx.unitId))
      ? -1
      : BigInt(base64ToHexPrefixed(a.tx.unitId)) >
        BigInt(base64ToHexPrefixed(b.tx.unitId))
      ? 1
      : 0
  );

export const sortIDBySize = (arr: string[]) =>
  arr.sort((a: string, b: string) =>
    BigInt(base64ToHexPrefixed(a)) < BigInt(base64ToHexPrefixed(b))
      ? -1
      : BigInt(base64ToHexPrefixed(a)) > BigInt(base64ToHexPrefixed(b))
      ? 1
      : 0
  );

export const getNewBearer = (account: IAccount) => {
  const address = account.pubKey.startsWith("0x")
    ? account.pubKey.substring(2)
    : account.pubKey;
  const addressHash = CryptoJS.enc.Hex.parse(address);
  const SHA256 = CryptoJS.SHA256(addressHash);

  return Buffer.from(
    startByte +
      opDup +
      opHash +
      sigScheme +
      opPushHash +
      sigScheme +
      SHA256.toString(CryptoJS.enc.Hex) +
      opEqual +
      opVerify +
      opCheckSig +
      sigScheme,
    "hex"
  ).toString("base64");
};

export const checkPassword = (password: string | undefined) => {
  if (!password) {
    return false;
  }
  return password.length >= 8;
};

export const getKeys = (
  password: string,
  accountIndex: number,
  vault: string | null
) => {
  if (!vault)
    return {
      hashingPublicKey: null,
      hashingPrivateKey: null,
      error: null,
      decryptedVault: null,
      masterKey: null,
    };

  const decryptedVault = CryptoJS.AES.decrypt(
    vault.toString(),
    password
  ).toString(CryptoJS.enc.Latin1);

  try {
    JSON.parse(decryptedVault);
  } catch {
    return {
      hashingPublicKey: null,
      hashingPrivateKey: null,
      error: "Password is incorrect!",
      decryptedVault: null,
      masterKey: null,
    };
  }

  const decryptedVaultJSON = JSON.parse(decryptedVault);

  if (
    decryptedVaultJSON?.entropy.length > 16 &&
    decryptedVaultJSON?.entropy.length < 32 &&
    decryptedVaultJSON?.entropy.length % 4 === 0
  ) {
    return {
      hashingPublicKey: null,
      hashingPrivateKey: null,
      error: "Password is incorrect!",
      decryptedVault: null,
      masterKey: null,
    };
  }

  const mnemonic = entropyToMnemonic(decryptedVaultJSON?.entropy);
  const seed = mnemonicToSeedSync(mnemonic);
  const masterKey = HDKey.fromMasterSeed(seed);
  const hashingKey = masterKey.derive(`m/44'/634'/${accountIndex}'/0/0`);
  const hashingPrivateKey = hashingKey.privateKey;
  const hashingPublicKey = hashingKey.publicKey;

  return {
    hashingPublicKey: hashingPublicKey,
    hashingPrivateKey: hashingPrivateKey,
    decryptedVault: decryptedVaultJSON,
    error: null,
    masterKey: masterKey,
    hashingKey: hashingKey,
  };
};

// Verify verifies the proof against given transaction, returns error if verification failed, or nil if verification succeeded.
export const Verify = async (
  proof: IProofProps,
  bill: IBill,
  hashingPrivateKey: Uint8Array,
  hashingPublicKey: Uint8Array
) => {
  const tx: IProofTx = proof.txProof.tx;
  if (bill.id?.length <= 0) {
    return "No bill ID";
  }

  if (tx === null || bill.id.length <= 0) {
    return "No transaction information";
  }

  let primHash;

  if (
    tx.transactionAttributes["@type"] ===
    "type.googleapis.com/rpc.TransferOrder"
  ) {
    primHash = await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(tx.systemId, "base64"),
        Buffer.from(tx.unitId, "base64"),
        Buffer.from(tx.ownerProof, "base64"),
        new Uint64BE(Number(tx.timeout)).toBuffer(),
        Buffer.from(tx.transactionAttributes.newBearer as string, "base64"),
        new Uint64BE(Number(tx.transactionAttributes.targetValue!)).toBuffer(),
        Buffer.from(tx.transactionAttributes.backlink, "base64")
      )
    );
  } else if (
    tx.transactionAttributes["@type"] === "type.googleapis.com/rpc.SplitOrder"
  ) {
    primHash = await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(tx.systemId, "base64"),
        Buffer.from(tx.unitId, "base64"),
        Buffer.from(tx.ownerProof, "base64"),
        new Uint64BE(Number(tx.timeout)).toBuffer(),
        new Uint64BE(Number(tx.transactionAttributes.amount)).toBuffer(),
        Buffer.from(tx.transactionAttributes.targetBearer as string, "base64"),
        new Uint64BE(
          Number(tx.transactionAttributes.remainingValue)
        ).toBuffer(),
        Buffer.from(tx.transactionAttributes.backlink, "base64")
      )
    );
  } else if (
    tx.transactionAttributes["@type"] === "type.googleapis.com/rpc.SwapOrder"
  ) {
    const identifiersBuffer = tx.transactionAttributes.billIdentifiers!.map(
      (i) => Buffer.from(i, "base64")
    );

    const transferMsgHashes =
      Buffer.concat(
        tx.transactionAttributes?.dcTransfers!.map((tx: IProofTx) => {
          return Buffer.concat([
            Buffer.from(tx.systemId, "base64"),
            Buffer.from(tx.unitId, "base64"),
            Buffer.from(tx.ownerProof, "base64"),
            new Uint64BE(Number(tx.timeout)).toBuffer(),
            Buffer.from(
              tx.transactionAttributes.targetBearer as string,
              "base64"
            ),
            new Uint64BE(
              Number(tx.transactionAttributes.targetValue!)
            ).toBuffer(),
            Buffer.from(tx.transactionAttributes.backlink, "base64"),
          ]);
        })

    );
    const proofsBuffer = tx.transactionAttributes?.proofs!.map((p: IProof) => {
      const chainItems = p.blockTreeHashChain.items.map((i) =>
        Buffer.concat([Buffer.from(i.val), Buffer.from(i.hash)])
      );
      const treeHashes =
        p.unicityCertificate.unicityTreeCertificate.siblingHashes.map((i) =>
          Buffer.from(i)
        );
      const signatureHashes = Object.values(
        p.unicityCertificate.unicitySeal.signatures
      ).map((s) => Buffer.from(s));

      return Buffer.concat([
        Buffer.from(p.proofType),
        Buffer.from(p.blockHeaderHash, "base64"),
        Buffer.from(p.transactionsHash, "base64"),
        Buffer.concat(chainItems),
        Buffer.from(p.unicityCertificate.inputRecord.previousHash, "base64"),
        Buffer.from(p.unicityCertificate.inputRecord.hash, "base64"),
        Buffer.from(p.unicityCertificate.inputRecord.blockHash, "base64"),
        Buffer.from(p.unicityCertificate.inputRecord.summaryValue, "base64"),
        Buffer.from(
          p.unicityCertificate.unicityTreeCertificate.systemIdentifier,
          "base64"
        ),
        Buffer.concat(treeHashes),
        Buffer.from(
          p.unicityCertificate.unicityTreeCertificate.systemDescriptionHash,
          "base64"
        ),
        new Uint64BE(
          p.unicityCertificate.unicitySeal.rootChainRoundNumber
        ).toBuffer(),
        Buffer.from(p.unicityCertificate.unicitySeal.previousHash, "base64"),
        Buffer.from(p.unicityCertificate.unicitySeal.hash, "base64"),
        Buffer.concat(signatureHashes),
      ]);
    });

    primHash = await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(tx.systemId, "base64"),
        Buffer.from(tx.unitId, "base64"),
        Buffer.from(tx.ownerProof, "base64"),
        new Uint64BE(tx.timeout).toBuffer(),
        Buffer.from(tx.transactionAttributes.ownerCondition!, "base64"),
        Buffer.concat(identifiersBuffer),
        transferMsgHashes,
        Buffer.concat(proofsBuffer),
        new Uint64BE(Number(tx.transactionAttributes.targetValue)).toBuffer()
      )
    );
  }

  if (!primHash) return "Primary hash is missing";

  const signature = await secp.sign(primHash, hashingPrivateKey, {
    der: false,
    recovered: true,
  });

  if (!secp.verify(signature[0], primHash, hashingPublicKey))
    return "Signature is not valid";

  const unitHash = await secp.utils.sha256(
    secp.utils.concatBytes(
      Buffer.from(primHash),
      Buffer.from(proof.txProof.proof.hashValue, "base64")
    )
  );

  console.log(
    bill.txHash,
    tx.transactionAttributes["@type"] === "type.googleapis.com/rpc.SplitOrder",
    Buffer.from(primHash).toString("base64")
  );

  return verifyChainHead(proof, bill.id, unitHash);
};

const verifyChainHead = (
  proof: IProofProps,
  billID: string,
  unitHash: Uint8Array
) => {
  const chain = proof.txProof.proof.blockTreeHashChain.items;
  console.log(
    chain[0].val === billID,
    chain[0].hash,
    Buffer.from(unitHash).toString("base64")
  );

  if (
    chain.length > 0 &&
    chain[0].val === billID &&
    chain[0].hash === Buffer.from(unitHash).toString("base64")
  ) {
    return null;
  }
  return "Block tree hash chain item does not match with given bill";
};

export const startByte = "53";
export const opPushSig = "54";
export const opPushPubKey = "55";
export const opDup = "76";
export const opHash = "a8";
export const opPushHash = "4f";
export const opCheckSig = "ac";
export const opEqual = "87";
export const opVerify = "69";
export const sigScheme = "01";

export const timeoutBlocks = 10;
export const swapTimeout = 40;
export const DCTransfersLimit = 100;
