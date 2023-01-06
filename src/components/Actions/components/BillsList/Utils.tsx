import * as secp from "@noble/secp256k1";

import {
  unit8ToHexPrefixed,
  startByte,
  opPushSig,
  opPushPubKey,
  sigScheme,
  swapTimeout,
} from "../../../../utils/utils";
import {
  IProof,
  IProofTx,
  ISwapProps,
  ISwapTransferProps,
  ITxProof,
} from "../../../../types/Types";
import { getBlockHeight, makeTransaction } from "../../../../hooks/requests";
import { swapOrderHash } from "../../../../utils/hashes";

export const handleSwapRequest = async (
  nonce: Buffer[],
  txProofs: ITxProof[],
  hashingPublicKey: Uint8Array,
  hashingPrivateKey: Uint8Array,
  billIdentifiers: string[],
  newBearer: string
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
    const msgHash = await swapOrderHash(transferData);
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
