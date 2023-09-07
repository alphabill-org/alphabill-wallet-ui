import {
  base64ToHexPrefixed,
  createOwnerProof,
  getNewBearer,
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
  IBill,
  IPayloadClientMetadata,
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
  publicKeyHashWithFeeType,
} from "../../../utils/hashers";

export const handleSwapRequest = async (
  hashingPublicKey: Uint8Array,
  hashingPrivateKey: Uint8Array,
  DCBills: IBill[],
  account: IAccount,
  activeAccountId: string,
  targetUnit: IBill
) => {
  const sortedBills = DCBills.sort((a: any, b: any) =>
    a.targetUnitId.localeCompare(b.targetUnitId)
  );

  const groupedBillsByTargetId = new Map();

  for (const obj of sortedBills) {
    if (!groupedBillsByTargetId.has(obj.targetUnitId)) {
      groupedBillsByTargetId.set(obj.targetUnitId, []);
    }
    groupedBillsByTargetId.get(obj.targetUnitId).push(obj);
  }

  const zeroBigInt = 0n;

  const calculateTargetValue = (bills: IBill[]) => {
    return bills.reduce((acc, obj) => acc + BigInt(obj.value), zeroBigInt);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_targetUnitId, bills] of groupedBillsByTargetId) {
    let tx_proofs: ITxProof[] = [];
    const sortedBills = sortBillsByID(bills);

    await Promise.all(
      sortedBills.map(async (bill: IBill) => {
        const data = await getProof(
          base64ToHexPrefixed(bill.id),
          base64ToHexPrefixed(bill.txHash)
        );

        if (data?.txProof) {
          const tx_proof = data! as ITxProof;
          tx_proof && tx_proofs.push(tx_proof);
        }
      })
    );

    if (tx_proofs.length === sortedBills.length) {
      const dcTransfers: Uint8Array[] = [];
      const proofs: Uint8Array[] = [];

      sortTx_ProofsByID(tx_proofs).forEach((proof) => {
        dcTransfers.push(proof.txRecord);
        proofs.push(proof.txProof);
      });

      if (!hashingPublicKey || !hashingPrivateKey) return;

      if (sortedBills.length === tx_proofs.length) {
        const roundNumber = await getRoundNumber(
          targetUnit?.typeId === AlphaType
        );

        const transferData: ITransactionPayload = {
          payload: {
            systemId: AlphaSystemId,
            type: AlphaSwapType,
            unitId: Buffer.from(targetUnit.id!, "base64"),
            attributes: {
              ownerCondition: getNewBearer(account),
              dcTransfers: dcTransfers,
              proofs: proofs,
              targetValue: calculateTargetValue(sortedBills),
            },
            clientMetadata: {
              timeout: roundNumber + SwapTimeout,
              MaxTransactionFee: MaxTransactionFee,
              feeCreditRecordID: await publicKeyHashWithFeeType({
                key: activeAccountId,
                isAlpha: true,
              }),
            } as IPayloadClientMetadata,
          },
        };

        const proof = await createOwnerProof(
          transferData.payload as ITransactionPayloadObj,
          hashingPrivateKey,
          hashingPublicKey
        );

        if (proof.isSignatureValid) {
          await makeTransaction(
            prepTransactionRequestData(transferData, proof.ownerProof),
            activeAccountId,
            true
          );
        }
      }
    }
  }
};

export const handleDC = async (
  addInterval: () => void,
  setIsConsolidationLoading: (e: boolean) => void,
  setHasSwapBegun: (e: boolean) => void,
  handleSwapCallBack: (e?: string) => void,
  account: IAccount,
  password: string,
  vault: any,
  billsList: IBill[],
  DCBills: IBill[],
  activeAccountId: string,
  targetUnit: IBill
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
  setIsConsolidationLoading(true);

  if (DCBills?.length >= 1) {
    handleSwapCallBack(password);
    addInterval();
  } else {
    getRoundNumber(targetUnit?.typeId === AlphaType).then((roundNumber) =>
      sortedListByID?.map(async (bill: IBill, idx) => {
        const transferData: ITransactionPayload = {
          payload: {
            systemId: AlphaSystemId,
            type: AlphaDcType,
            unitId: Buffer.from(bill.id, "base64"),
            attributes: {
              value: BigInt(bill.value),
              targetUnitID: Buffer.from(targetUnit.id!, "base64"),
              targetUnitBacklink: Buffer.from(targetUnit.txHash!, "base64"),
              backlink: Buffer.from(bill.txHash, "base64"),
            },
            clientMetadata: {
              timeout: roundNumber + TimeoutBlocks,
              MaxTransactionFee: MaxTransactionFee,
              feeCreditRecordID: await publicKeyHashWithFeeType({
                key: activeAccountId,
                isAlpha: true,
              }) as Uint8Array,
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
          if (sortedListByID?.length === idx + 1) {
            addInterval();
            setHasSwapBegun(false);
          }
        };
      })
    );
  }
};
