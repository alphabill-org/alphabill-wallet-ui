import * as secp from "@noble/secp256k1";

import {
  unit8ToHexPrefixed,
  startByte,
  opPushSig,
  opPushPubKey,
  sigScheme,
  swapTimeout,
  swapProofsBuffer,
  dcTransfersBuffer,
  identifiersBuffer,
} from "../../../../utils/utils";
import { Uint64BE } from "int64-buffer";
import {
  IProof,
  IProofTx,
  ISwapProps,
  ISwapTransferProps,
  ITxProof,
} from "../../../../types/Types";
import { getBlockHeight, makeTransaction } from "../../../../hooks/requests";

export const handleSwapRequest = async (
  nonce: Buffer[],
  txProofs: ITxProof[],
  hashingPublicKey: Uint8Array,
  hashingPrivateKey: Uint8Array,
  billIdentifiers: string[],
  newBearer: string,
  transferMsgHashes: Uint8Array[]
) => {
  let dcTransfers: IProofTx[] = [];
  let proofs: IProof[] = [];

  txProofs.forEach((txProof) => {
    const tx = txProof.tx;
    const proof = txProof.proof;
    dcTransfers.push(tx);
    proofs.push(proof);
  });

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
      timeout: blockData.blockHeight + swapTimeout,
      ownerProof: "",
    };

    const msgHash = await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(transferData.systemId, "base64"),
        Buffer.from(transferData.unitId, "base64"),
        new Uint64BE(transferData.timeout).toBuffer(),
        Buffer.from(
          transferData.transactionAttributes.ownerCondition,
          "base64"
        ),
        identifiersBuffer(transferData.transactionAttributes.billIdentifiers),
        dcTransfersBuffer(transferData.transactionAttributes.dcTransfers),
        Buffer.concat(transferMsgHashes),
        swapProofsBuffer(proofs),
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

    const ownerProof = await Buffer.from(
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

    const dataWithProof: ISwapTransferProps = await Object.assign(
      transferData,
      {
        ownerProof: ownerProof,
      }
    );

    isValid && makeTransaction(dataWithProof);
  });
};
