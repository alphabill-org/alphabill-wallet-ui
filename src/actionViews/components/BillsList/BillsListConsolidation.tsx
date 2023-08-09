import * as secp from "@noble/secp256k1";

import {
  base64ToHexPrefixed,
  createOwnerProof,
  getNewBearer,
  sortIDBySize,
  sortTx_ProofsByID,
} from "../../../utils/utils";
import {
  AlphaDcType,
  AlphaSwapType,
  AlphaSystemId,
  SwapTimeout,
  TimeoutBlocks,
  DCTransfersLimit,
  AlphaType,
  MaxTransactionFee,
} from "../../../utils/constants";
import {
  IAccount,
  IActiveAsset,
  IBill,
  ITransactionPayload,
  ITransactionPayloadObj,
  ITxProof,
} from "../../../types/Types";
import {
  getRoundNumber,
  getProof,
  makeTransaction,
} from "../../../hooks/requests";
import { getKeys, sortBillsByID } from "../../../utils/utils";
import {
  prepTransactionRequestData,
  publicKeyHash,
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
  let tx_proofs: ITxProof[] = [];
  let billIdentifiers: Buffer[] = [];

  sortIDBySize(lastNonceIDs?.[activeAccountId]).forEach((id: string) => {
    const idBuffer = Buffer.from(id, "base64");
    billIdentifiers.push(idBuffer);
  });

  DCBills?.map((bill: IBill) =>
    getProof(
      base64ToHexPrefixed(bill.id),
      base64ToHexPrefixed(bill.txHash)
    ).then(async (data) => {
      if (data?.txProof) {
        const tx_proof = data! as ITxProof;

        tx_proof && tx_proofs.push(tx_proof);
        if (tx_proofs?.length === DCBills.length) {
          let dcTransfers: Uint8Array[] = [];
          let proofs: Uint8Array[] = [];

          sortTx_ProofsByID(tx_proofs).forEach((proof) => {
            dcTransfers.push(proof.txRecord);
            proofs.push(proof.txProof);
          });

          if (!hashingPublicKey || !hashingPrivateKey) return;

          if (!billIdentifiers.length) return;
          const nonceHash = await secp.utils.sha256(
            Buffer.concat(billIdentifiers)
          );

          getRoundNumber(activeAsset?.typeId === AlphaType).then(
            async (roundNumber) => {
              const transferData: ITransactionPayload = {
                payload: {
                  systemId: AlphaSystemId,
                  type: AlphaSwapType,
                  unitId: Buffer.from(nonceHash),
                  attributes: {
                    ownerCondition: getNewBearer(account),
                    billIdentifiers: billIdentifiers,
                    dcTransfers: dcTransfers,
                    proofs: proofs,
                    targetValue: DCBills?.reduce((acc, obj: any) => {
                      return acc + BigInt(obj.value);
                    }, 0n),
                  },
                  clientMetadata: {
                    timeout: roundNumber + SwapTimeout,
                    MaxTransactionFee: MaxTransactionFee,
                    feeCreditRecordID: (await publicKeyHash(
                      activeAccountId
                    )) as Uint8Array,
                  },
                },
              };

              const proof = await createOwnerProof(
                transferData.payload as ITransactionPayloadObj,
                hashingPrivateKey,
                hashingPublicKey
              );

              proof.isSignatureValid &&
                makeTransaction(
                  prepTransactionRequestData(transferData, proof.ownerProof),
                  activeAccountId,
                  true
                );
            }
          );
        }
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
  lastNonceIDs: { [key: string]: string[] },
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

  if (
    DCBills?.length >= 1 &&
    Number(lastNonceIDs?.[activeAccountId]?.length) >= 1
  ) {
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
            attributes: {
              nonce: nonceHash,
              targetBearer: getNewBearer(account),
              targetValue: BigInt(bill.value),
              backlink: Buffer.from(bill.txHash, "base64"),
            },
            clientMetadata: {
              timeout: roundNumber + TimeoutBlocks,
              MaxTransactionFee: MaxTransactionFee,
              feeCreditRecordID: (await publicKeyHash(
                activeAccountId
              )) as Uint8Array,
            },
          },
        };

        const proof = await createOwnerProof(
          transferData.payload as ITransactionPayloadObj,
          hashingPrivateKey,
          hashingPublicKey
        );

        if (proof.isSignatureValid !== true) return;

        makeTransaction(
          prepTransactionRequestData(transferData, proof.ownerProof),
          activeAccountId,
          true
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
