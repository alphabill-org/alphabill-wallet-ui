import * as secp from "@noble/secp256k1";

import {
  IBill,
  IChainItems,
  IInputRecord,
  IProofProps,
  IProofTx,
  ISwapProps,
  IUnicityCertificate,
  IUnicitySeal,
  IUnicityTreeCertificate,
} from "../types/Types";
import {
  inputRecordBuffer,
  splitOrderHash,
  swapOrderHash,
  transferOrderHash,
} from "./hashes";

// Fixed constants
const signingPublicKey = "AswruvQ9RghmioVBQu43Mk//acFrHdJ1raMbvbZBvdKl";
const systemIdentifier = "AAAAAA==";
const systemDescriptionHash = "1xLJvNPorwq+KXmXUY4IhQwyVJJO1ROXgYNxcrBt25U=";

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

  const err = verifyUC(
    proof,
    bill.id,
    signingPublicKey,
    Buffer.from(await secp.utils.sha256())
  );
  if (err !== null) {
    return err;
  }

  if (tx === null || bill.id.length <= 0) {
    return "No transaction information";
  }

  let primHash;

  if (
    tx.transactionAttributes["@type"] ===
    "type.googleapis.com/rpc.TransferOrder"
  ) {
    primHash = await transferOrderHash(tx, true);
  } else if (
    tx.transactionAttributes["@type"] === "type.googleapis.com/rpc.SplitOrder"
  ) {
    primHash = await splitOrderHash(tx, true);
  } else if (
    tx.transactionAttributes["@type"] === "type.googleapis.com/rpc.SwapOrder"
  ) {
    primHash = await swapOrderHash(tx as ISwapProps, true);
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

  return verifyChainHead(proof, bill.id, unitHash);
};

const verifyChainHead = (
  proof: IProofProps,
  billID: string,
  unitHash: Uint8Array
) => {
  const chain = proof.txProof.proof.blockTreeHashChain.items;

  if (
    chain.length > 0 &&
    chain[0].val === billID &&
    chain[0].hash === Buffer.from(unitHash).toString("base64")
  ) {
    return null;
  }
  return "Block tree hash chain item does not match";
};

const verifyUC = async (
  proof: IProofProps,
  billID: string,
  signingPublicKey: string,
  hashAlgorithm: Uint8Array
) => {
  if (!proof.txProof.proof.unicityCertificate) {
    return "Unicity certificate is missing";
  }

  const certErr = unicityCertificateIsValid(
    proof.txProof.proof.unicityCertificate,
    signingPublicKey,
    systemIdentifier,
    systemDescriptionHash
  );

  if (certErr !== null) {
    return certErr;
  }

  const chainItems = proof.txProof.proof.blockTreeHashChain.items;
  const { rBlock, err } = evalMerklePath(
    chainItems,
    Buffer.from(billID, "base64")
  );

  if (err || !rBlock) {
    return err;
  }

  const blockHash = secp.utils
    .sha256(
      secp.utils.concatBytes(
        hashAlgorithm,
        Buffer.from(proof.txProof.proof.blockHeaderHash, "base64"),
        Buffer.from(proof.txProof.proof.transactionsHash, "base64"),
        await rBlock
      )
    )
    .toString();

  if (
    proof.txProof.proof.unicityCertificate.inputRecord.blockHash !== blockHash
  ) {
    return (
      "Proof verification failed, uc.ir block hash is not valid, got " +
      proof.txProof.proof.unicityCertificate.inputRecord.blockHash +
      " expected " +
      blockHash
    );
  }
  return null;
};

// EvalMerklePath returns root hash calculated from the given hash chain, or zerohash if chain is empty
const evalMerklePath = (
  chainItems: IChainItems[] | null,
  value: Uint8Array
) => {
  if (!chainItems) {
    return { rBlock: null, err: "Chain items missing" };
  }

  let hasher: Uint8Array = Buffer.alloc(0);

  for (let i = 0; i < chainItems.length; i++) {
    if (i === 0) {
      hasher = computeLeafTreeHash(chainItems[i], hasher);
    } else {
      hasher = secp.utils.concatBytes(hasher, Buffer.from(chainItems[i].val));
      if (Buffer.compare(value, Buffer.from(chainItems[i].val)) <= 0) {
        hasher = secp.utils.concatBytes(
          hasher,
          Buffer.from(chainItems[i].hash)
        );
      } else {
        hasher = secp.utils.concatBytes(
          hasher,
          Buffer.from(chainItems[i].hash)
        );
      }
    }
  }

  return { rBlock: secp.utils.sha256(hasher), err: null };
};

const computeLeafTreeHash = (item: any, hasher: Uint8Array) =>
  secp.utils.concatBytes(
    Buffer.alloc(1), // leaf hash starts with byte 1 to prevent false proofs
    item.val,
    item.hash
  );

export const unicityCertificateIsValid = async (
  unicityCertificate: IUnicityCertificate,
  signingPublicKey: string,
  systemIdentifier: string,
  systemDescriptionHash: string
) => {
  if (!unicityCertificate) {
    return "Unicity certificate is missing";
  }
  if (unicitySealIsValid(unicityCertificate.unicitySeal, signingPublicKey)) {
    return unicitySealIsValid(unicityCertificate.unicitySeal, signingPublicKey);
  }
  if (inputRecordIsValid(unicityCertificate.inputRecord)) {
    return inputRecordIsValid(unicityCertificate.inputRecord);
  }
  if (
    unicityTreeCertificateIsValid(
      unicityCertificate.unicityTreeCertificate,
      systemIdentifier,
      systemDescriptionHash
    )
  ) {
    return unicityTreeCertificateIsValid(
      unicityCertificate.unicityTreeCertificate,
      systemIdentifier,
      systemDescriptionHash
    );
  }

  const hasherSum = await secp.utils.sha256(
    secp.utils.concatBytes(
      inputRecordBuffer(unicityCertificate.inputRecord),
      Buffer.from(
        unicityCertificate.unicityTreeCertificate.systemDescriptionHash,
        "base64"
      )
    )
  );

  const { treeRoot, err } = await calculatePathRoot(
    unicityCertificate.unicityTreeCertificate.siblingHashes,
    hasherSum,
    Buffer.from(
      unicityCertificate.unicityTreeCertificate.systemIdentifier,
      "base64"
    )
  );

  if (err || !treeRoot) {
    return err;
  }

  const rootHash = unicityCertificate.unicitySeal.hash;

  if ((await Buffer.from(treeRoot)?.toString("base64")) !== rootHash) {
    return (
      "Unicity seal hash: " +
      rootHash +
      " does not match with the root hash of the unicity tree: " +
      (await Buffer.from(treeRoot)?.toString("base64"))
    );
  }
  return null;
};

export const calculatePathRoot = async (
  siblingHashes: string[],
  leafHash: Uint8Array,
  key: Uint8Array
) => {
  const hashAlgorithm = await secp.utils.sha256();

  if (!key) {
    return { treeRoot: null, err: "invalid key length" };
  }

  const keyLength = key.length * 8;

  if (siblingHashes.length !== keyLength) {
    return {
      treeRoot: null,
      err:
        "Invalid path/key combination: path length=" +
        siblingHashes.length +
        " key length=" +
        keyLength,
    };
  }

  if (leafHash.length !== hashAlgorithm.length) {
    return {
      treeRoot: null,
      err:
        "Invalid leaf hash length: leaf length=" +
        leafHash.length +
        " hash length=" +
        hashAlgorithm.length,
    };
  }

  let treeRootBuffer = Buffer.from([0]);
  let l = leafHash;
  const pathLength = siblingHashes.length;

  for (let i = 0; i < pathLength; i++) {
    let pathItem = Buffer.from(siblingHashes[i], "base64");
    if (isBitSet(key, pathLength - 1 - i)) {
      treeRootBuffer = Buffer.concat([pathItem, l]);
    } else {
      treeRootBuffer = Buffer.concat([l, pathItem]);
    }
    l = treeRootBuffer
      ? await secp.utils.sha256(treeRootBuffer)
      : Buffer.from([0]);
  }

  return {
    treeRoot: treeRootBuffer ? await secp.utils.sha256(treeRootBuffer) : null,
    err: null,
  };
};

const isBitSet = (bytes: Uint8Array, bitPosition: number) => {
  const byteIndex = Math.floor(bitPosition / 8);
  const bitIndexInByte = bitPosition % 8;
  return (bytes[byteIndex] & (1 << (7 - bitIndexInByte))) !== 0;
};

export const unicitySealIsValid = (
  unicitySeal: IUnicitySeal,
  signingPublicKey: string
) => {
  if (!unicitySeal) {
    return "Unicity seal is missing";
  }
  if (signingPublicKey.length === 0) {
    return "Root validator info is missing";
  }
  if (!unicitySeal.hash) {
    return "Unicity seal hash is missing";
  }
  if (!unicitySeal.previousHash) {
    return "Unicity seal previous hash is missing";
  }
  if (unicitySeal.rootChainRoundNumber < 1) {
    return "Unicity seal has invalid block number";
  }
  if (unicitySeal.signatures.length === 0) {
    return "Unicity seal has no signatures";
  }
  return null;
};

export const inputRecordIsValid = (inputRecord: IInputRecord) => {
  if (!inputRecord) {
    return "Input record is missing";
  }
  if (!inputRecord.hash) {
    return "Input record hash is missing";
  }
  if (!inputRecord.blockHash) {
    return "Input record  block hash is missing";
  }
  if (!inputRecord.previousHash) {
    return "Input record previous hash is missing";
  }
  if (!inputRecord.summaryValue) {
    return "Input record summary value is missing";
  }
  return null;
};

export const unicityTreeCertificateIsValid = (
  unicityTreeCertificate: IUnicityTreeCertificate,
  systemIdentifier: string,
  systemDescriptionHash: string
) => {
  if (!unicityTreeCertificate) {
    return "Unicity tree certificate is missing";
  }
  if (unicityTreeCertificate.systemIdentifier !== systemIdentifier) {
    return (
      "Unicity tree certificate has invalid system identifier: expected " +
      systemIdentifier +
      " got " +
      unicityTreeCertificate.systemIdentifier
    );
  }
  if (systemDescriptionHash !== unicityTreeCertificate.systemDescriptionHash) {
    return (
      "Unicity tree certificate has invalid system description hash: expected " +
      systemDescriptionHash +
      " got " +
      unicityTreeCertificate.systemDescriptionHash
    );
  }

  const siblingHashesLength =
    Buffer.from(systemIdentifier, "base64").length * 8; // bits in system identifier
  const treeHashes = unicityTreeCertificate.siblingHashes.map((i) =>
    Buffer.from(i, "base64")
  );
  if (treeHashes.length !== siblingHashesLength) {
    return (
      "Unicity tree certificate has invalid count of sibling hashes: expected " +
      siblingHashesLength +
      " got " +
      unicityTreeCertificate.siblingHashes.length
    );
  }
  return null;
};
