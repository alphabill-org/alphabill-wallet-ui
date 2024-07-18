import {base64ToHexPrefixed, createOwnerProof, getKeys, predicateP2PKH, sortBillsByID,} from "../../../utils/utils";
import {
    AlphaDcType,
    AlphaSwapType,
    AlphaSystemId,
    AlphaType,
    DCTransfersLimit,
    MaxTransactionFee,
    SwapTimeout,
    TimeoutBlocks,
} from "../../../utils/constants";
import {
    IAccount,
    IBill,
    IPayloadClientMetadata,
    ITransactionPayload,
    ITransactionPayloadObj,
} from "../../../types/Types";
import {getProof, getRoundNumber, MONEY_BACKEND_URL,} from "../../../hooks/requests";
import {prepTransactionRequestData, publicKeyHashWithFeeType,} from "../../../utils/hashers";
import {TransactionRecordWithProof} from "@alphabill/alphabill-js-sdk/lib/TransactionRecordWithProof";
import {TransactionPayload} from "@alphabill/alphabill-js-sdk/lib/transaction/TransactionPayload";
import {createMoneyClient, http} from "@alphabill/alphabill-js-sdk/lib/StateApiClientFactory";
import {TransactionOrderFactory} from "@alphabill/alphabill-js-sdk/lib/transaction/TransactionOrderFactory";
import {DefaultSigningService} from "@alphabill/alphabill-js-sdk/lib/signing/DefaultSigningService";
import {FeeCreditRecordUnitIdFactory} from "@alphabill/alphabill-js-sdk/lib/transaction/FeeCreditRecordUnitIdFactory";
import {CborCodecWeb} from "@alphabill/alphabill-js-sdk/lib/codec/cbor/CborCodecWeb";
import {UnitId} from "@alphabill/alphabill-js-sdk/lib/UnitId";
import {Base64Converter} from "@alphabill/alphabill-js-sdk/lib/util/Base64Converter";
import {PayToPublicKeyHashPredicate} from "@alphabill/alphabill-js-sdk/lib/transaction/PayToPublicKeyHashPredicate";
import {
    TransferBillToDustCollectorAttributes
} from "@alphabill/alphabill-js-sdk/lib/transaction/TransferBillToDustCollectorAttributes";
import {UnitType} from "@alphabill/alphabill-js-sdk/lib/transaction/UnitType";

export const handleSwapRequest = async (
    hashingPublicKey: Uint8Array,
    hashingPrivateKey: Uint8Array,
    DCBills: IBill[],
    account: IAccount,
    activeAccountId: string,
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

    for (const [, bills] of groupedBillsByTargetId) {
        const tx_proofs: TransactionRecordWithProof<TransactionPayload<TransferBillToDustCollectorAttributes>>[] = [];
        const sortedBills = sortBillsByID(bills);

        await Promise.all(
            sortedBills.map(async (bill: IBill) => {
                const data = await getProof(
                    base64ToHexPrefixed(bill.txHash)
                );

                if (data?.transactionProof) {
                    tx_proofs.push(data as TransactionRecordWithProof<TransactionPayload<TransferBillToDustCollectorAttributes>>);
                }
            })
        );

        if (tx_proofs.length === sortedBills.length) {
            const firstBill = sortedBills[0];

            if (!hashingPublicKey || !hashingPrivateKey) return;

            if (sortedBills.length === tx_proofs.length) {
                const roundNumber = await getRoundNumber(
                    firstBill?.typeId === AlphaType
                );

                const cborCodec = new CborCodecWeb();
                const signingService = new DefaultSigningService(hashingPrivateKey);
                const moneyClient = createMoneyClient({
                    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
                    transport: http(MONEY_BACKEND_URL, cborCodec),
                    feeCreditRecordUnitIdFactory: new FeeCreditRecordUnitIdFactory()
                });

                const ownerPredicate = await PayToPublicKeyHashPredicate.create(cborCodec, signingService.publicKey);
                await moneyClient.swapBillsWithDustCollector(
                    {
                        bill: {unitId: UnitId.fromBytes(Base64Converter.decode(firstBill.targetUnitId!)), counter: 0n},
                        ownerPredicate,
                        proofs: tx_proofs,
                    },
                    {
                        maxTransactionFee: MaxTransactionFee,
                        timeout: roundNumber + SwapTimeout,
                        feeCreditRecordId: new FeeCreditRecordUnitIdFactory().create(roundNumber + SwapTimeout, ownerPredicate, UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD),
                        referenceNumber: null
                    },
                );

            }
        }
    }
};

export const handleDC = async (
    addInterval: () => void,
    setIsConsolidationLoading: (e: boolean) => void,
    handleSwapCallBack: (e?: string) => void,
    account: IAccount,
    password: string,
    vault: any,
    billsList: IBill[],
    DCBills: IBill[],
    activeAccountId: string,
    targetUnit: IBill
) => {
    const {error, hashingPrivateKey, hashingPublicKey} = getKeys(
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
                    }
                };
            })
        );
    }
};
