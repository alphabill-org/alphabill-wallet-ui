import * as secp from "@noble/secp256k1";

import {
  base64ToHexPrefixed,
  createOwnerProof,
  DCTransfersLimit,
  getNewBearer,
  sortIDBySize,
  sortTxProofsByID,
  swapTimeout,
  timeoutBlocks,
} from "../../../utils/utils";
import {
  IAccount,
  IActiveAsset,
  IBill,
  IProof,
  IProofTx,
  ISwapProps,
  ISwapTransferProps,
  ITransfer,
  ITxProof,
} from "../../../types/Types";
import {
  getBlockHeight,
  getProof,
  makeTransaction,
} from "../../../hooks/requests";
import { getKeys, sortBillsByID } from "../../../utils/utils";
import { dcOrderHash, swapOrderHash } from "../../../utils/hashers";

export const handleSwapRequest = async (
  hashingPublicKey: Uint8Array,
  hashingPrivateKey: Uint8Array,
  DCBills: IBill[],
  account: IAccount,
  activeAccountId: string,
  lastNonceIDs: { [key: string]: string[] },
  activeAsset: IActiveAsset
) => {
  let nonce: Buffer[] = [];
  let txProofs: ITxProof[] = [];
  let billIdentifiers: string[] = [];

  sortIDBySize(lastNonceIDs?.[activeAccountId]).forEach((id: string) => {
    nonce.push(Buffer.from(id, "base64"));
    billIdentifiers.push(id);
  });

  DCBills.map((bill: IBill, idx: number) =>
    getProof(base64ToHexPrefixed(bill.id)).then(
      async (data) => {
        const txProof = data.bills[0].txProof;

        txProofs.push(txProof);
        if (txProofs.length === DCBills.length) {
          let dcTransfers: IProofTx[] = [];
          let proofs: IProof[] = [];

          sortTxProofsByID(txProofs).forEach((txProof) => {
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
              systemId:
                activeAsset?.typeId === "ALPHA" ? "AAAAAA==" : "AAAAAg==",
              unitId: Buffer.from(nonceHash).toString("base64"),
              transactionAttributes: {
                billIdentifiers: sortIDBySize(billIdentifiers),
                dcTransfers: dcTransfers,
                ownerCondition: getNewBearer(account),
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
            const proof = await createOwnerProof(
              msgHash,
              hashingPrivateKey,
              hashingPublicKey
            );

            const dataWithProof: ISwapTransferProps = await Object.assign(
              transferData,
              {
                ownerProof: proof.ownerProof,
              }
            );

            proof.isSignatureValid &&
              makeTransaction(
                dataWithProof,
                activeAsset?.typeId === "ALPHA" ? "" : account.pubKey
              );
          });
        }
      }
    )
  );
};

export const handleDC = async (
  addInterval: () => void,
  setIsConsolidationLoading: (e: boolean) => void,
  setLastNonceIDsLocal: (e: string) => void,
  setHasSwapBegun: (e: boolean) => void,
  handleSwapCallBack: (e?: string) => void,
  account: IAccount,
  password: string,
  vault: any,
  unlockedBills: IBill[],
  DCBills: IBill[],
  lastNonceIDs: any[],
  activeAccountId: string,
  activeAsset: IActiveAsset
) => {
  const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
    password,
    Number(account.idx),
    vault
  );

  if (error || !hashingPublicKey || !hashingPrivateKey) {
    return;
  }

  const limitedUnlockedBills = unlockedBills.slice(0, DCTransfersLimit);

  const sortedListByID = sortBillsByID(limitedUnlockedBills);
  let nonce: Buffer[] = [];
  let IDs: string[] = [];

  setIsConsolidationLoading(true);

  if (DCBills.length >= 1) {
    DCBills.map((bill: IBill) => nonce.push(Buffer.from(bill.id, "base64")));
    handleSwapCallBack(password);
    addInterval();
  } else {
    sortedListByID.forEach((bill: IBill) => {
      nonce.push(Buffer.from(bill.id, "base64"));
      IDs.push(bill.id);
    });

    if (!nonce.length) return;

    const nonceHash = await secp.utils.sha256(Buffer.concat(nonce));
    let total = 0;

    getBlockHeight().then((blockData) =>
      sortedListByID.map(async (bill: IBill, idx) => {
        total = total + 1;

        const transferData: ITransfer = {
          systemId: activeAsset?.typeId === "ALPHA" ? "AAAAAA==" : "AAAAAg==",
          unitId: bill.id,
          transactionAttributes: {
            "@type": "type.googleapis.com/rpc.TransferDCOrder",
            backlink: bill.txHash,
            nonce: Buffer.from(nonceHash).toString("base64"),
            targetBearer: getNewBearer(account),
            targetValue: bill.value.toString(),
          },
          timeout: blockData.blockHeight + timeoutBlocks,
          ownerProof: "",
        };

        const msgHash = await dcOrderHash(transferData, bill, nonceHash);
        const proof = await createOwnerProof(
          msgHash,
          hashingPrivateKey,
          hashingPublicKey
        );

        if (proof.isSignatureValid !== true) return;

        const dataWithProof = Object.assign(transferData, {
          ownerProof: proof.ownerProof,
          timeout: blockData.blockHeight + timeoutBlocks,
        });

        makeTransaction(
          dataWithProof,
          activeAsset?.typeId === "ALPHA" ? "" : account.pubKey
        )
          .then(() => handleTransactionEnd())
          .catch(() => handleTransactionEnd());

        const handleTransactionEnd = () => {
          setLastNonceIDsLocal(
            JSON.stringify(
              Object.assign(lastNonceIDs, {
                [activeAccountId]: IDs,
              })
            )
          );

          if (sortedListByID.length === idx + 1) {
            addInterval();
            setHasSwapBegun(false);
          }
        };
      })
    );
  }
};
