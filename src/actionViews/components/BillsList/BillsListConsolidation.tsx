import * as secp from "@noble/secp256k1";

import {
  AlphaDcType,
  AlphaSwapType,
  AlphaSystemId,
  base64ToHexPrefixed,
  createOwnerProof,
  DCTransfersLimit,
  getNewBearer,
  sortIDBySize,
  sortTxProofsByID,
  swapTimeout,
  timeoutBlocks,
  TokensDcType,
  TokensSwapType,
  TokensSystemId,
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
    getProof(base64ToHexPrefixed(bill.id)).then(async (data) => {
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
        getBlockHeight().then(async (blockHeight) => {
          let swapType = TokensSwapType;
          let systemId = TokensSystemId;

          if (activeAsset?.typeId === "ALPHA") {
            swapType = AlphaSwapType;
            systemId = AlphaSystemId;
          }

          const transferData: ISwapProps = {
            systemId: systemId,
            unitId: Buffer.from(nonceHash).toString("base64"),
            transactionAttributes: {
              billIdentifiers: sortIDBySize(billIdentifiers),
              dcTransfers: dcTransfers,
              ownerCondition: getNewBearer(account),
              proofs: proofs,
              targetValue: dcTransfers
                .reduce((acc, obj: IProofTx) => {
                  return acc + BigInt(obj.transactionAttributes.targetValue!);
                }, 0n)

                .toString(),
              "@type": swapType,
            },
            timeout: (blockHeight + swapTimeout).toString(),
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

          proof.isSignatureValid && makeTransaction(dataWithProof);
        });
      }
    })
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

    getBlockHeight().then((blockHeight) =>
      sortedListByID.map(async (bill: IBill, idx) => {
        let burnType = TokensDcType;
        let systemId = TokensSystemId;

        if (activeAsset?.typeId === "ALPHA") {
          burnType = AlphaDcType;
          systemId = AlphaSystemId;
        }

        const transferData: ITransfer = {
          systemId: systemId,
          unitId: bill.id,
          transactionAttributes: {
            "@type": burnType,
            backlink: bill.txHash,
            nonce: Buffer.from(nonceHash).toString("base64"),
            targetBearer: getNewBearer(account),
            targetValue: bill.value,
          },
          timeout: (blockHeight + timeoutBlocks).toString(),
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
