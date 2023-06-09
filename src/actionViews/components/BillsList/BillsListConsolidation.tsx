import * as secp from "@noble/secp256k1";
import { encode } from "cbor-x";

import {
  base64ToHexPrefixed,
  createOwnerProof,
  getNewBearer,
  sortIDBySize,
  sortTxProofsByID,
} from "../../../utils/utils";
import {
  AlphaDcType,
  AlphaSwapType,
  AlphaSystemId,
  swapTimeout,
  timeoutBlocks,
  DCTransfersLimit,
  AlphaType,
  maxTransactionFee,
} from "../../../utils/constants";
import {
  IAccount,
  IActiveAsset,
  IBill,
  IProof,
  ITransactionPayload,
  ITxProof,
} from "../../../types/Types";
import {
  getRoundNumber,
  getProof,
  makeTransaction,
} from "../../../hooks/requests";
import { getKeys, sortBillsByID } from "../../../utils/utils";
import {
  dcOrderHash,
  publicKeyHash,
  swapOrderHash,
} from "../../../utils/hashers";

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

  DCBills?.map((bill: IBill, idx: number) =>
    getProof(base64ToHexPrefixed(bill.id)).then(async (data) => {
      const txProof = data?.bills[0].txProof;

      txProof && txProofs.push(txProof);
      if (txProofs?.length === DCBills.length) {
        let dcTransfers: ITransactionPayload[] = [];
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
        getRoundNumber(activeAsset?.typeId === AlphaType).then(
          async (roundNumber) => {
            const transferData: ITransactionPayload = {
              payload: {
                systemId: AlphaSystemId,
                type: AlphaSwapType,
                unitId: Buffer.from(nonceHash),
                transactionAttributes: {
                  billIdentifiers: sortIDBySize(billIdentifiers),
                  dcTransfers: dcTransfers,
                  ownerCondition: getNewBearer(account),
                  proofs: proofs,
                  targetValue: dcTransfers?.reduce((acc, obj: any) => {
                    return (
                      acc +
                      BigInt(obj.payload.transactionAttributes.targetValue!)
                    );
                  }, 0n),
                },
                clientMetadata: {
                  timeout: roundNumber + swapTimeout,
                  maxTransactionFee: maxTransactionFee,
                  feeCreditRecordID: await publicKeyHash(hashingPublicKey),
                },
              },
            };

            const msgHash = await swapOrderHash(transferData);
            const proof = await createOwnerProof(
              msgHash,
              hashingPrivateKey,
              hashingPublicKey
            );

            let dataWithProof: ITransactionPayload = await Object.assign(
              transferData,
              {
                ownerProof: proof.ownerProof,
              }
            );

            dataWithProof.payload.transactionAttributes = encode(
              dataWithProof.payload.transactionAttributes
            );

            proof.isSignatureValid && makeTransaction([encode(dataWithProof)]);
          }
        );
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
  billsList: IBill[],
  DCBills: IBill[],
  lastNonceIDs: any[],
  activeAccountId: string,
  activeAsset: IActiveAsset
) => {
  const { error, hashingPrivateKey, hashingPublicKey } = getKeys(
    password,
    Number(account?.idx),
    vault
  );

  if (error || !hashingPublicKey || !hashingPrivateKey) {
    return;
  }

  const limitedBillsList = billsList.slice(0, DCTransfersLimit);

  const sortedListByID = sortBillsByID(limitedBillsList);
  let nonce: Buffer[] = [];
  let IDs: string[] = [];

  setIsConsolidationLoading(true);

  if (DCBills?.length >= 1) {
    DCBills?.map((bill: IBill) => nonce.push(Buffer.from(bill.id, "base64")));
    handleSwapCallBack(password);
    addInterval();
  } else {
    sortedListByID.forEach((bill: IBill) => {
      nonce.push(Buffer.from(bill.id, "base64"));
      IDs.push(bill.id);
    });

    if (!nonce.length) return;

    const nonceHash = await secp.utils.sha256(Buffer.concat(nonce));

    getRoundNumber(activeAsset?.typeId === AlphaType).then((roundNumber) =>
      sortedListByID?.map(async (bill: IBill, idx) => {
        const transferData: ITransactionPayload = {
          payload: {
            systemId: AlphaSystemId,
            type: AlphaDcType,
            unitId: Buffer.from(bill.id, "base64"),
            transactionAttributes: {
              backlink: Buffer.from(bill.txHash, "base64"),
              nonce: nonceHash,
              targetBearer: getNewBearer(account),
              targetValue: BigInt(bill.value),
            },
            clientMetadata: {
              timeout: roundNumber + timeoutBlocks,
              maxTransactionFee: maxTransactionFee,
              feeCreditRecordID: await publicKeyHash(hashingPublicKey),
            },
          },
        };

        const msgHash = await dcOrderHash(transferData, bill, nonceHash);
        const proof = await createOwnerProof(
          msgHash,
          hashingPrivateKey,
          hashingPublicKey
        );

        if (proof.isSignatureValid !== true) return;

        let dataWithProof = Object.assign(transferData, {
          ownerProof: proof.ownerProof,
        });
        dataWithProof.payload.transactionAttributes = encode(
          dataWithProof.payload.transactionAttributes
        );
        makeTransaction(
          [encode(dataWithProof)],
          activeAsset?.typeId === AlphaType ? "" : account.pubKey
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

          if (sortedListByID?.length === idx + 1) {
            addInterval();
            setHasSwapBegun(false);
          }
        };
      })
    );
  }
};
