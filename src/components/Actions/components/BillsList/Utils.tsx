import * as secp from "@noble/secp256k1";

import {
  getKeys,
  unit8ToHexPrefixed,
  startByte,
  opPushSig,
  opPushPubKey,
  sigScheme,
} from "../../../../utils/utils";
import { Uint64BE } from "int64-buffer";
import {
  IAccount,
  IDCTransferProps,
  ISwapProofProps,
  ISwapProps,
  ISwapTransferProps,
} from "../../../../types/Types";
import { getBlockHeight, makeTransaction } from "../../../../hooks/requests";

export const handleSwapRequest = async (
  nonce: Buffer[],
  proofs: ISwapProofProps[],
  dcTransfers: IDCTransferProps[],
  formPassword: string | undefined,
  password: string,
  billIdentifiers: string[],
  newBearer: string,
  transferMsgHashes: Uint8Array[],
  account: IAccount,
  vault: string | null,
  resetLoader: any
) => {
  const { hashingPrivateKey, hashingPublicKey } = getKeys(
    formPassword || password,
    Number(account.idx),
    vault
  );

  if (!hashingPublicKey || !hashingPrivateKey) return;

  if (!nonce.length) return;
  const nonceHash = await secp.utils.sha256(Buffer.concat(nonce));
  getBlockHeight().then(async (blockData) => {
    const transferData: ISwapProps = {
      systemId: "AAAAAA==",
      unitId: Buffer.from(nonceHash).toString("base64"),
      transactionAttributes: {
        billIdentifiers: billIdentifiers,
        dcTransfers: dcTransfers,
        ownerCondition: newBearer,
        proofs: proofs,
        targetValue: dcTransfers
          .reduce(
            (total, obj) =>
              Number(obj.transactionAttributes.targetValue) + total,
            0
          )
          .toString(),
        "@type": "type.googleapis.com/rpc.SwapOrder",
      },
      timeout: blockData.blockHeight + 10,
      ownerProof: "",
    };

    const identifiersBuffer =
      transferData.transactionAttributes.billIdentifiers.map((i) =>
        Buffer.from(i, "base64")
      );

    const proofsBuffer = proofs.map((p: ISwapProofProps) => {
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

    const msgHash = await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(transferData.systemId, "base64"),
        Buffer.from(transferData.unitId, "base64"),
        new Uint64BE(transferData.timeout).toBuffer(),
        Buffer.from(
          transferData.transactionAttributes.ownerCondition,
          "base64"
        ),
        Buffer.concat(identifiersBuffer),
        Buffer.concat(transferMsgHashes),
        Buffer.concat(proofsBuffer),
        new Uint64BE(
          Number(transferData.transactionAttributes.targetValue)
        ).toBuffer()
      )
    );

    const signature = await secp.sign(msgHash, hashingPrivateKey, {
      der: false,
      recovered: true,
    });

    const isValid = secp.verify(signature[0], msgHash, hashingPublicKey);

    const ownerProof = Buffer.from(
      startByte +
        opPushSig +
        sigScheme +
        Buffer.from(
          secp.utils.concatBytes(signature[0], Buffer.from([signature[1]]))
        ).toString("hex") +
        opPushPubKey +
        sigScheme +
        unit8ToHexPrefixed(hashingPublicKey).substring(2),
      "hex"
    ).toString("base64");

    const dataWithProof: ISwapTransferProps = Object.assign(transferData, {
      ownerProof: ownerProof,
    });

    isValid &&
      makeTransaction(dataWithProof)
        .then(() => resetLoader)
        .catch(() => resetLoader);
  });
};
