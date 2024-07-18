import {IBalance, IBill, IFeeCreditBills, IListTokensResponse,} from "../types/Types";
import {AlphaType, DownloadableTypes, MaxImageSize, TokenType} from "../utils/constants";
import {addDecimal, separateDigits,} from "../utils/utils";
import {TransactionOrderFactory} from "@alphabill/alphabill-js-sdk/lib/transaction/TransactionOrderFactory";
import {CborCodecWeb} from "@alphabill/alphabill-js-sdk/lib/codec/cbor/CborCodecWeb";
import {DefaultSigningService} from "@alphabill/alphabill-js-sdk/lib/signing/DefaultSigningService";
import {Base16Converter} from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import {createMoneyClient, createTokenClient, http} from "@alphabill/alphabill-js-sdk/lib/StateApiClientFactory";
import {UnitType} from "@alphabill/alphabill-js-sdk/lib/transaction/UnitType";
import {Bill} from "@alphabill/alphabill-js-sdk/lib/Bill";
import {NonFungibleToken} from "@alphabill/alphabill-js-sdk/lib/NonFungibleToken";
import {IUnitId} from "@alphabill/alphabill-js-sdk/lib/IUnitId";
import {FungibleToken} from "@alphabill/alphabill-js-sdk/lib/FungibleToken";
import {FungibleTokenType} from "@alphabill/alphabill-js-sdk/lib/FungibleTokenType";
import {IUnit} from "@alphabill/alphabill-js-sdk/lib/IUnit";
import {NonFungibleTokenType} from "@alphabill/alphabill-js-sdk/lib/NonFungibleTokenType";
import {Base64Converter} from "@alphabill/alphabill-js-sdk/lib/util/Base64Converter";
import {FeeCreditRecordUnitIdFactory} from "@alphabill/alphabill-js-sdk/lib/transaction/FeeCreditRecordUnitIdFactory";
import {TokenUnitIdFactory} from "@alphabill/alphabill-js-sdk/lib/transaction/TokenUnitIdFactory";
import {TransactionRecordWithProof} from "@alphabill/alphabill-js-sdk/lib/TransactionRecordWithProof";
import {TransactionPayload} from "@alphabill/alphabill-js-sdk/lib/transaction/TransactionPayload";
import {ITransactionPayloadAttributes} from "@alphabill/alphabill-js-sdk/lib/transaction/ITransactionPayloadAttributes";
import {FeeCreditRecord} from "@alphabill/alphabill-js-sdk/lib/FeeCreditRecord";

export const MONEY_BACKEND_URL = import.meta.env.VITE_MONEY_BACKEND_URL;
export const TOKENS_BACKEND_URL = import.meta.env.VITE_TOKENS_BACKEND_URL;

export enum TokenUnitType {
    FUNGIBLE = "fungible",
    NON_FUNGIBLE = "nft"
}

const cborCodec = new CborCodecWeb();
const moneyQueryClient = createMoneyClient({
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, null as unknown as DefaultSigningService),
    transport: http(MONEY_BACKEND_URL, cborCodec),
    feeCreditRecordUnitIdFactory: new FeeCreditRecordUnitIdFactory()
});
const tokenQueryClient = createTokenClient({
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, null as unknown as DefaultSigningService),
    transport: http(TOKENS_BACKEND_URL, cborCodec),
    tokenUnitIdFactory: new TokenUnitIdFactory(cborCodec)
});

export const getBalance = async (
    pubKey: string
): Promise<IBalance | undefined> => {
    const units = await moneyQueryClient
        .getUnitsByOwnerId(pubKey ? Base16Converter.decode(pubKey) : new Uint8Array());
    const idList = units.filter((unit) => unit.type.toBase16() === UnitType.MONEY_PARTITION_BILL_DATA);
    let balance = 0;
    for (const id of idList) {
        const bill = await moneyQueryClient.getUnit(id, false) as unknown as Bill | null;
        balance += bill ? Number(bill?.value) : 0;
    }

    return {balance, pubKey};
};

export const getBillsList = async (
    pubKey: string,
): Promise<IBill[] | undefined> => {
    const units = await moneyQueryClient
        .getUnitsByOwnerId(pubKey ? Base16Converter.decode(pubKey) : new Uint8Array());
    const idList = units.filter((unit) => unit.type.toBase16() === UnitType.MONEY_PARTITION_BILL_DATA);
    let billsList: IBill[] = [];
    for (const id of idList) {
        const bill = await moneyQueryClient.getUnit(id, true) as unknown as Bill | null;
        if (bill) {
            billsList.push({
                id: Base16Converter.encode(id.bytes),
                value: bill.value.toString(),
                txHash: Base16Converter.encode(bill.stateProof?.unitLedgerHash ?? new Uint8Array()),
                typeId: AlphaType,
            })
        }
    }

    return billsList;
};

export const getUserTokens = async (
    pubKey: string,
    kind: TokenUnitType,
    activeAsset?: string
): Promise<IListTokensResponse[]> => {
    const units = await tokenQueryClient
        .getUnitsByOwnerId(pubKey ? Base16Converter.decode(pubKey) : new Uint8Array());
    let type: UnitType;
    switch (kind) {
        case TokenUnitType.FUNGIBLE:
            type = UnitType.TOKEN_PARTITION_NON_FUNGIBLE_TOKEN;
            break;
        case TokenUnitType.NON_FUNGIBLE:
            type = UnitType.TOKEN_PARTITION_FUNGIBLE_TOKEN;
            break;
        default:
            throw new Error("Unsupported token");
    }
    const list = units.filter((unit) => unit.type.toBase16() === type);
    const tokens: IListTokensResponse[] = [];
    const tokenTypes = new Map<string, IUnit>();
    for (const id of list) {
        const unit = await tokenQueryClient.getUnit(id, true) as { tokenType: IUnitId } | null;
        if (!unit) {
            continue;
        }

        let typeUnit: IUnit | null = tokenTypes.get(Base16Converter.encode(unit.tokenType.bytes)) ?? null;
        if (!typeUnit) {
            typeUnit = await tokenQueryClient.getUnit(unit.tokenType, false);
            if (!typeUnit) {
                throw new Error("Unknown token type");
            }
            tokenTypes.set(Base16Converter.encode(unit.tokenType.bytes), typeUnit);
        }
        let result: IListTokensResponse;
        switch (kind) {
            case TokenUnitType.FUNGIBLE: {
                const token = unit as FungibleToken;
                const tokenType = typeUnit as FungibleTokenType;
                result = {
                    id: Base16Converter.encode(token.unitId.bytes),
                    typeId: Base64Converter.encode(token.tokenType.bytes),
                    owner: Base64Converter.encode(token.ownerPredicate.bytes),
                    kind: 2,
                    txHash: Base16Converter.encode(token.stateProof?.unitLedgerHash ?? new Uint8Array()),
                    symbol: tokenType.symbol,
                    network: import.meta.env.VITE_NETWORK_NAME,
                    nftName: tokenType.name,
                    decimals: tokenType.decimalPlaces,
                    amount: token.value.toString(),
                    UIAmount: separateDigits(addDecimal(token.value.toString(), tokenType.decimalPlaces)),
                };
                break;
            }
            case TokenUnitType.NON_FUNGIBLE: {
                const token = unit as NonFungibleToken;
                const tokenType = typeUnit as NonFungibleTokenType;
                result = {
                    id: Base16Converter.encode(token.unitId.bytes),
                    typeId: Base64Converter.encode(token.tokenType.bytes),
                    owner: Base64Converter.encode(token.ownerPredicate.bytes),
                    kind: 4,
                    txHash: Base16Converter.encode(token.stateProof?.unitLedgerHash ?? new Uint8Array()),
                    symbol: tokenType.symbol,
                    network: import.meta.env.VITE_NETWORK_NAME,
                    nftName: tokenType.name,
                    nftData: Base64Converter.encode(token.data),
                    nftUri: token.uri,
                    nftDataUpdatePredicate: Base64Converter.encode(token.dataUpdatePredicate.bytes),
                };
                break;
            }
            default:
                throw new Error("Unsupported token");
        }

        if (activeAsset && result.typeId === activeAsset) {
            tokens.push(result);
        }
    }

    return tokens;
};

export const getProof = async (
    txHash: string,
    isTokens?: boolean
): Promise<TransactionRecordWithProof<TransactionPayload<ITransactionPayloadAttributes>> | null> => {

    const hashBytes = Base16Converter.decode(txHash);

    return isTokens
        ? tokenQueryClient.getTransactionProof(hashBytes)
        : moneyQueryClient.getTransactionProof(hashBytes);
};

export const getRoundNumber = async (isAlpha: boolean): Promise<bigint> => {
    return isAlpha ? moneyQueryClient.getRoundNumber() : tokenQueryClient.getRoundNumber();
};

export const getImageUrl = async (
    url?: string
): Promise<{ error: string | null; imageUrl: string | null }> => {
    if (!url) {
        return {error: "Missing image URL", imageUrl: null};
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 3000);

    try {
        const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal
        });

        if (response.status === 200) {
            const contentLength = response.headers.get('content-length');
            if (contentLength && Number(contentLength) > MaxImageSize) {
                return {error: "Image size exceeds 5MB limit", imageUrl: null};
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.startsWith("image/")) {
                return {imageUrl: url, error: null};
            }
        }

        return {error: "Invalid image URL", imageUrl: null};
    } catch (error) {
        if (controller.signal.aborted) {
            console.error("Request cancelled:", error);
        }

        return {error: "Failed to fetch image", imageUrl: null};
    } finally {
        clearTimeout(timeout);
    }
};

export const getImageUrlAndDownloadType = async (
    url?: string
): Promise<{
    imageUrl: string | null;
    downloadType: string | null;
    error?: string;
} | null> => {
    if (!url) {
        return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 3000);


    try {
        const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal
        });

        if (response.status === 200) {
            const contentType = response.headers.get("content-type");
            const contentLength = response.headers.get("content-length");

            if (contentType && contentType.startsWith("image/")) {
                if (contentLength && Number(contentLength) > MaxImageSize) {
                    return {
                        imageUrl: url,
                        downloadType: contentType,
                        error: "Image size exceeds 5MB",
                    };
                }

                return {
                    imageUrl: url,
                    downloadType: contentType,
                };
            }

            if (contentType && DownloadableTypes.includes(contentType)) {
                return {
                    imageUrl: null,
                    downloadType: contentType,
                };
            }
        }

        return null;
    } catch (error) {
        if (controller.signal.aborted) {
            console.error("Request cancelled:", error);
        }

        return null;
    } finally {
        clearTimeout(timeout);
    }
};

export const getFeeCreditBills = async (
    id: string
): Promise<IFeeCreditBills | undefined> => {
    if (!id) return;

    const [moneyFeeCredit, tokenFeeCredit] = await Promise.all([
        moneyQueryClient
            .getUnitsByOwnerId(Base16Converter.decode(id))
            .then(
                (list) => {
                    const id = list.find(
                        (id) => id.type.toBase16() === UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD);

                    if (!id) {
                        return null;
                    }

                    return moneyQueryClient.getUnit(id, true) as Promise<FeeCreditRecord | null>;
                }),
        tokenQueryClient
            .getUnitsByOwnerId(Base16Converter.decode(id))
            .then(
                (list) => {
                    const id = list.find(
                        (id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD);

                    if (!id) {
                        return null;
                    }

                    return moneyQueryClient.getUnit(id, true) as Promise<FeeCreditRecord | null>;
                }
            )]);

    return {
        [AlphaType]: moneyFeeCredit
            ? {
                id: Base64Converter.encode(moneyFeeCredit.unitId.bytes),
                value: moneyFeeCredit.balance.toString(),
                txHash: Base64Converter.encode(moneyFeeCredit.stateProof!.unitLedgerHash),
                lastAddFcTxHash: Base64Converter.encode(moneyFeeCredit.stateProof!.unitTreeCert.transactionRecordHash),
            }
            : null,
        [TokenType]: tokenFeeCredit
            ? {
                id: Base64Converter.encode(tokenFeeCredit.unitId.bytes),
                value: tokenFeeCredit.balance.toString(),
                txHash: Base64Converter.encode(tokenFeeCredit.stateProof!.unitLedgerHash),
                lastAddFcTxHash: Base64Converter.encode(tokenFeeCredit.stateProof!.unitTreeCert.transactionRecordHash),
            }
            : null,
    };
};

export const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url, {
        method: "GET"
    });
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
};
