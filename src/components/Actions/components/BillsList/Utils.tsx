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
import { IAccount, ISwapProofProps, ISwapProps } from "../../../../types/Types";
import { getBlockHeight, makeTransaction } from "../../../../hooks/requests";

export const handleSwapRequest = async (
  nonce: Buffer[],
  proofs: ISwapProofProps[],
  dc_transfers: any,
  formPassword: string | undefined,
  password: string,
  billIdentifiers: string[],
  newBearer: string,
  transferMsgHashes: Uint8Array[],
  account: IAccount,
  vault: string | null
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
      system_id: "AAAAAA==",
      unit_id: Buffer.from(nonceHash).toString("base64"),
      type: "SwapOrder",
      attributes: {
        bill_identifiers: billIdentifiers,
        dc_transfers: dc_transfers,
        owner_condition: newBearer,
        proofs: proofs,
        target_value: 10,
      },
      timeout: blockData.blockHeight + 42,
      owner_proof: "",
    };

    const identifiersBuffer = transferData.attributes.bill_identifiers.map(
      (i) => Buffer.from(i, "base64")
    );

    const proofsBuffer = proofs.map((p: ISwapProofProps) => {
      const chainItems = p.block_tree_hash_chain.items.map((i) =>
        Buffer.concat([Buffer.from(i.val), Buffer.from(i.hash)])
      );
      const treeHashes =
        p.unicity_certificate.unicity_tree_certificate.sibling_hashes.map((i) =>
          Buffer.from(i)
        );
      const signatureHashes = Object.values(
        p.unicity_certificate.unicity_seal.signatures
      ).map((s) => Buffer.from(s));

      return Buffer.concat([
        Buffer.from(p.proof_type),
        Buffer.from(p.block_header_hash, "base64"),
        Buffer.from(p.transactions_hash, "base64"),
        Buffer.concat(chainItems),
        Buffer.from(p.unicity_certificate.input_record.previous_hash, "base64"),
        Buffer.from(p.unicity_certificate.input_record.hash, "base64"),
        Buffer.from(p.unicity_certificate.input_record.block_hash, "base64"),
        Buffer.from(p.unicity_certificate.input_record.summary_value, "base64"),
        Buffer.from(
          p.unicity_certificate.unicity_tree_certificate.system_identifier,
          "base64"
        ),
        Buffer.concat(treeHashes),
        Buffer.from(
          p.unicity_certificate.unicity_tree_certificate
            .system_description_hash,
          "base64"
        ),
        new Uint64BE(
          p.unicity_certificate.unicity_seal.root_chain_round_number
        ).toBuffer(),
        Buffer.from(p.unicity_certificate.unicity_seal.previous_hash, "base64"),
        Buffer.from(p.unicity_certificate.unicity_seal.hash, "base64"),
        Buffer.concat(signatureHashes),
      ]);
    });

    const msgHash = await secp.utils.sha256(
      secp.utils.concatBytes(
        Buffer.from(transferData.system_id, "base64"),
        Buffer.from(transferData.unit_id, "base64"),
        new Uint64BE(transferData.timeout).toBuffer(),
        Buffer.from(transferData.attributes.owner_condition, "base64"),
        Buffer.concat(identifiersBuffer),
        Buffer.concat(transferMsgHashes),
        Buffer.concat(proofsBuffer),
        new Uint64BE(transferData.attributes.target_value).toBuffer()
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

    const dataWithProof = Object.assign(transferData, {
      owner_proof: ownerProof,
    });

    isValid && makeTransaction(dataWithProof);
  });
};
