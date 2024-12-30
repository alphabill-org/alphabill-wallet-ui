import { FeeCreditRecord } from "@alphabill/alphabill-js-sdk/lib/fees/FeeCreditRecord";
import { AddFeeCredit } from "@alphabill/alphabill-js-sdk/lib/fees/transactions/AddFeeCredit";
import { CloseFeeCredit } from "@alphabill/alphabill-js-sdk/lib/fees/transactions/CloseFeeCredit";
import { TransferFeeCredit } from "@alphabill/alphabill-js-sdk/lib/fees/transactions/TransferFeeCredit";
import { IUnitId } from "@alphabill/alphabill-js-sdk/lib/IUnitId";
import { Bill } from "@alphabill/alphabill-js-sdk/lib/money/Bill";
import { SplitBill } from "@alphabill/alphabill-js-sdk/lib/money/transactions/SplitBill";
import { SwapBillsWithDustCollector } from "@alphabill/alphabill-js-sdk/lib/money/transactions/SwapBillsWithDustCollector";
import { TransferBill } from "@alphabill/alphabill-js-sdk/lib/money/transactions/TransferBill";
import { TransferBillToDustCollector } from "@alphabill/alphabill-js-sdk/lib/money/transactions/TransferBillToDustCollector";
import { NetworkIdentifier } from "@alphabill/alphabill-js-sdk/lib/NetworkIdentifier";
import { PartitionIdentifier } from "@alphabill/alphabill-js-sdk/lib/PartitionIdentifier";
import { DefaultSigningService } from "@alphabill/alphabill-js-sdk/lib/signing/DefaultSigningService.js";
import { createMoneyClient, createTokenClient, http } from "@alphabill/alphabill-js-sdk/lib/StateApiClientFactory.js";
import { FungibleToken } from "@alphabill/alphabill-js-sdk/lib/tokens/FungibleToken";
import { FungibleTokenType } from "@alphabill/alphabill-js-sdk/lib/tokens/FungibleTokenType";
import { NonFungibleToken } from "@alphabill/alphabill-js-sdk/lib/tokens/NonFungibleToken";
import { NonFungibleTokenType } from "@alphabill/alphabill-js-sdk/lib/tokens/NonFungibleTokenType";
import { SplitFungibleToken } from "@alphabill/alphabill-js-sdk/lib/tokens/transactions/SplitFungibleToken";
import { TransferFungibleToken } from "@alphabill/alphabill-js-sdk/lib/tokens/transactions/TransferFungibleToken";
import { TransferNonFungibleToken } from "@alphabill/alphabill-js-sdk/lib/tokens/transactions/TransferNonFungibleToken";
import { ClientMetadata } from "@alphabill/alphabill-js-sdk/lib/transaction/ClientMetadata";
import { ITransactionClientMetadata } from "@alphabill/alphabill-js-sdk/lib/transaction/ITransactionClientMetadata";
import { PayToPublicKeyHashPredicate } from "@alphabill/alphabill-js-sdk/lib/transaction/predicates/PayToPublicKeyHashPredicate.js";
import { IBalance, IBill, IFeeCreditBills, IListTokensResponse } from "../types/Types";
import { AlphaType, DownloadableTypes, MaxImageSize, TokenType } from "../utils/constants";
import { addDecimal, separateDigits } from "../utils/utils";
import { AlwaysTruePredicate } from "@alphabill/alphabill-js-sdk/lib/transaction/predicates/AlwaysTruePredicate.js";
import { PayToPublicKeyHashProofFactory } from "@alphabill/alphabill-js-sdk/lib/transaction/proofs/PayToPublicKeyHashProofFactory.js";
import { ITransactionData } from "@alphabill/alphabill-js-sdk/lib/transaction/ITransactionData";
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";

export const MONEY_BACKEND_URL = import.meta.env.VITE_MONEY_BACKEND_URL;
export const TOKENS_BACKEND_URL = import.meta.env.VITE_TOKENS_BACKEND_URL;

export enum TokenUnitType {
  FUNGIBLE = "fungible",
  NON_FUNGIBLE = "nft",
}

const moneyClient = createMoneyClient({
  transport: http(MONEY_BACKEND_URL),
});

const tokenClient = createTokenClient({
  transport: http(TOKENS_BACKEND_URL),
});

const getPartitionIdentifier = (isAlpha: boolean | undefined) => {
  return isAlpha ? PartitionIdentifier.MONEY : PartitionIdentifier.TOKEN;
};

const compareArray = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const getBalance = async (pubKey: string): Promise<IBalance | undefined> => {
  const unitIds = (await moneyClient.getUnitsByOwnerId(Base16Converter.decode(pubKey))).bills;
  if (!unitIds || unitIds.length <= 0) return;
  let balance = 0;
  try {
    for (const id of unitIds) {
      const bill = await moneyClient.getUnit(id, false, Bill);
      balance += bill ? Number(bill?.value) : 0;
    }
    return { balance, pubKey };
  } catch (error) {
    console.error("Error fetching units values:", error);
    return;
  }
};

export const getBillsList = async (pubKey: string): Promise<IBill[] | undefined> => {
  const idList = (await moneyClient.getUnitsByOwnerId(Base16Converter.decode(pubKey))).bills;
  if (!idList || idList.length <= 0) return;
  const billsList: IBill[] = [];
  try {
    for (const id of idList) {
      const bill = await moneyClient.getUnit(id, true, Bill);
      if (bill) {
        billsList.push({
          id: Base16Converter.encode(id.bytes),
          value: bill.value.toString(),
          txHash: Base16Converter.encode(bill.stateProof?.unitLedgerHash ?? new Uint8Array()),
          typeId: AlphaType,
        });
      }
    }
    return billsList;
  } catch (error) {
    console.error("Error fetching unit by id:", error);
    return;
  }
};

export const getUserTokens = async (
  pubKey: string,
  kind: TokenUnitType,
  activeAsset?: string,
): Promise<IListTokensResponse[]> => {
  let isFungible: boolean;
  switch (kind) {
    case TokenUnitType.FUNGIBLE:
      isFungible = true;
      break;
    case TokenUnitType.NON_FUNGIBLE:
      isFungible = false;
      break;
    default:
      throw new Error("Unsupported token");
  }
  const list = isFungible
    ? (await tokenClient.getUnitsByOwnerId(Base16Converter.decode(pubKey))).fungibleTokens
    : (await tokenClient.getUnitsByOwnerId(Base16Converter.decode(pubKey))).nonFungibleTokens;

  if (!list || list.length <= 0) {
    return [];
  }

  const tokens: IListTokensResponse[] = [];
  const tokenTypes = new Map<string, FungibleTokenType | NonFungibleTokenType>();
  for (const id of list) {
    const unit = isFungible
      ? await tokenClient.getUnit(id, true, FungibleToken)
      : await tokenClient.getUnit(id, true, NonFungibleToken);

    if (!unit) {
      continue;
    }

    const typeUnitKey = Base16Converter.encode(unit.typeId.bytes);
    let typeUnit: FungibleTokenType | NonFungibleTokenType | null = tokenTypes.get(typeUnitKey) ?? null;
    if (!typeUnit) {
      typeUnit = isFungible
        ? await tokenClient.getUnit(unit.typeId, false, FungibleTokenType)
        : await tokenClient.getUnit(unit.typeId, false, NonFungibleTokenType);
      if (!typeUnit) {
        throw new Error("Unknown token type");
      }
      tokenTypes.set(typeUnitKey, typeUnit);
    }
    let result: IListTokensResponse;
    switch (kind) {
      case TokenUnitType.FUNGIBLE: {
        const token = unit as FungibleToken;
        const tokenType = typeUnit as FungibleTokenType;
        result = {
          id: Base16Converter.encode(token.unitId.bytes),
          typeId: Base16Converter.encode(token.typeId.bytes),
          owner: Base16Converter.encode(token.ownerPredicate.bytes),
          kind: 2,
          txHash: Base16Converter.encode(token.stateProof?.unitLedgerHash ?? new Uint8Array()),
          symbol: tokenType.symbol,
          network: import.meta.env.VITE_NETWORK_NAME,
          decimals: tokenType.decimalPlaces,
          amount: token.value.toString(),
          UIAmount: separateDigits(addDecimal(token.value.toString(), tokenType.decimalPlaces)),
          value: token.value.toString(),
          icon: tokenType.icon,
        };
        break;
      }
      case TokenUnitType.NON_FUNGIBLE: {
        const token = unit as NonFungibleToken;
        const tokenType = typeUnit as NonFungibleTokenType;
        result = {
          id: Base16Converter.encode(token.unitId.bytes),
          typeId: Base16Converter.encode(token.typeId.bytes),
          owner: Base16Converter.encode(token.ownerPredicate.bytes),
          kind: 4,
          txHash: Base16Converter.encode(token.stateProof?.unitLedgerHash ?? new Uint8Array()),
          symbol: tokenType.symbol,
          network: import.meta.env.VITE_NETWORK_NAME,
          nftName: tokenType.name,
          nftData: Base16Converter.encode(token.data),
          nftUri: token.uri,
          nftDataUpdatePredicate: Base16Converter.encode(token.dataUpdatePredicate.bytes),
          icon: tokenType.icon,
        };
        break;
      }
      default:
        throw new Error("Unsupported token");
    }

    if (!activeAsset || result.typeId === activeAsset) {
      tokens.push(result);
    }
  }
  return tokens;
};

export const getFeeCreditBills = async (pubKey: string): Promise<IFeeCreditBills | undefined> => {
  if (!pubKey) return;

  const [moneyFeeCredit, tokenFeeCredit] = await Promise.all([
    (async () => {
      const feeCreditUnitIds = (await moneyClient.getUnitsByOwnerId(Base16Converter.decode(pubKey))).feeCreditRecords;
      if (!feeCreditUnitIds || feeCreditUnitIds.length === 0) return null;
      return await moneyClient.getUnit(feeCreditUnitIds[0], true, FeeCreditRecord);
    })(),
    (async () => {
      const feeCreditUnitIds = (await tokenClient.getUnitsByOwnerId(Base16Converter.decode(pubKey))).feeCreditRecords;
      if (!feeCreditUnitIds || feeCreditUnitIds.length === 0) return null;
      return await tokenClient.getUnit(feeCreditUnitIds[0], true, FeeCreditRecord);
    })(),
  ]);

  const formatFeeCredit = (feeCredit: FeeCreditRecord | null) =>
    feeCredit
      ? {
          id: Base16Converter.encode(feeCredit.unitId.bytes),
          value: feeCredit.balance.toString(),
          txHash: Base16Converter.encode(feeCredit.stateProof!.unitLedgerHash),
          lastAddFcTxHash: Base16Converter.encode(feeCredit.stateProof!.unitTreeCertificate.transactionRecordHash),
        }
      : null;

  return {
    [AlphaType]: formatFeeCredit(moneyFeeCredit),
    [TokenType]: formatFeeCredit(tokenFeeCredit),
  };
};

export const addFeeCredit = async (privateKey: Uint8Array, amount: bigint, billId: Uint8Array, isAlpha?: boolean) => {
  const signingService = new DefaultSigningService(privateKey);
  const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

  const moneyClientFee = createMoneyClient({
    transport: http(MONEY_BACKEND_URL),
  });

  const tokenClientFee = createTokenClient({
    transport: http(TOKENS_BACKEND_URL),
  });

  const units = (await moneyClient.getUnitsByOwnerId(signingService.publicKey)).bills;
  const unitId = units.find((id) => compareArray(id.bytes, billId));

  if (!unitId) {
    throw new Error("No bills available");
  }

  const bill = await moneyClientFee.getUnit(unitId, false, Bill);

  if (!bill) {
    throw new Error("Bill not found");
  }
  const round = await moneyClientFee.getRoundNumber();
  const ownerPredicate = PayToPublicKeyHashPredicate.create(signingService.publicKey);

  const partitionIdentifier = getPartitionIdentifier(isAlpha);

  const transferFeeCreditTransactionOrder = await TransferFeeCredit.create({
    amount: amount,
    targetPartitionIdentifier: partitionIdentifier,
    latestAdditionTime: round + 60n,
    feeCreditRecord: {
      ownerPredicate: ownerPredicate,
    },
    bill,
    ...createTransactionData(round),
  }).sign(proofFactory);

  const transferFeeCreditHash = await moneyClient.sendTransaction(transferFeeCreditTransactionOrder);

  const transferFeeCreditProof = await moneyClient.waitTransactionProof(transferFeeCreditHash, TransferFeeCredit);

  const feeCreditRecordId = transferFeeCreditTransactionOrder.payload.attributes.targetUnitId;

  const addFeeCreditTransactionOrder = await AddFeeCredit.create({
    targetPartitionIdentifier: partitionIdentifier,
    ownerPredicate: ownerPredicate,
    proof: transferFeeCreditProof,
    feeCreditRecord: { unitId: feeCreditRecordId },
    ...createTransactionData(round),
  }).sign(proofFactory);

  const addFeeCreditHash = isAlpha
    ? await moneyClientFee.sendTransaction(addFeeCreditTransactionOrder)
    : await tokenClientFee.sendTransaction(addFeeCreditTransactionOrder);

  return isAlpha
    ? await moneyClientFee.waitTransactionProof(addFeeCreditHash, AddFeeCredit)
    : await tokenClientFee.waitTransactionProof(addFeeCreditHash, AddFeeCredit);
};

export const reclaimFeeCredit = async (privateKey: Uint8Array, isAlpha?: boolean) => {
  const signingService = new DefaultSigningService(privateKey);
  const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

  const moneyClientReclaim = createMoneyClient({
    transport: http(MONEY_BACKEND_URL),
  });

  const client = isAlpha
    ? moneyClientReclaim
    : createTokenClient({
        transport: http(TOKENS_BACKEND_URL),
      });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);

  const unitsMoney = !isAlpha ? await moneyClientReclaim.getUnitsByOwnerId(signingService.publicKey) : [];

  const targetBillId = isAlpha
    ? units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_BILL_DATA)
    : unitsMoney.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_BILL_DATA);

  const feeCreditRecordId: IUnitId = units.feeCreditRecords[0];

  if (!feeCreditRecordId) {
    throw new Error("No fee credit available");
  }

  if (!targetBillId) {
    throw new Error("No bills were found");
  }

  const bill = await moneyClientReclaim.getUnit(targetBillId, false, Bill);
  const feeCreditRecord = await client.getUnit(feeCreditRecordId, false, FeeCreditRecord);
  const round = await client.getRoundNumber();

  if (!bill) {
    throw new Error("Bill does not exist");
  }

  const closeFeeCreditTransactionOrder = await CloseFeeCredit.create({
    bill,
    feeCreditRecord,
    ...createTransactionData(round),
  }).sign(proofFactory);

  const closeFeeCreditHash = await moneyClient.sendTransaction(closeFeeCreditTransactionOrder);
  const proof = await client.getTransactionProof(closeFeeCreditHash, CloseFeeCredit);

  const reclaimFeeCreditHash = await moneyClientReclaim.reclaimFeeCredit({
    proof,
    bill,
    ...createTransactionData(round),
  });

  return reclaimFeeCreditHash;
};

export const transferBill = async (privateKey: Uint8Array, recipient: Uint8Array, billId: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

  const client = createMoneyClient({
    transport: http(MONEY_BACKEND_URL),
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId =
    units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD) ?? null;
  const unitId = units.findLast((id) => compareArray(id.bytes, billId));

  if (!unitId) {
    throw new Error("No bills were found");
  }

  const round = await client.getRoundNumber();
  const bill = await client.getUnit(unitId, false, Bill);

  if (!bill) {
    throw new Error("Bill does not exist");
  }

  const transferBillTransactionOrder = await TransferBill.create({
    ownerPredicate: PayToPublicKeyHashPredicate.create(recipient),
    bill,
    ...createTransactionData(round, feeCreditRecordId),
  }).sign(proofFactory, proofFactory);

  return await moneyClient.sendTransaction(transferBillTransactionOrder);
};

export const transferFungibleToken = async (privateKey: Uint8Array, recipient: Uint8Array, tokenId: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL),
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD);
  const unitId = units.findLast((id) => compareArray(id.bytes, tokenId));
  const round = await client.getRoundNumber();

  if (!feeCreditRecordId) {
    throw new Error("No fee credit available");
  }

  if (!unitId) {
    throw new Error("Error fetching fungible tokens");
  }

  const token = await client.getUnit(unitId, false, FungibleToken);

  if (!token) {
    throw new Error("Token does not exist");
  }

  const transferFungibleTokenTransactionOrder = await TransferFungibleToken.create({
    token,
    ownerPredicate: PayToPublicKeyHashPredicate.create(recipient),
    type: { unitId: token.typeId },
    ...createTransactionData(round, feeCreditRecordId),
  }).sign(proofFactory, proofFactory, []);

  return await moneyClient.sendTransaction(transferFungibleTokenTransactionOrder);
};

export const splitBill = async (privateKey: Uint8Array, amount: bigint, recipient: Uint8Array, billId: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

  const client = createMoneyClient({
    transport: http(MONEY_BACKEND_URL),
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD);
  const unitId = units.findLast((id) => compareArray(id.bytes, billId));
  const round = await client.getRoundNumber();

  if (!unitId) {
    throw new Error("Error fetching unitId");
  }

  if (!feeCreditRecordId) {
    throw new Error("Error fetching fee credit record");
  }

  const bill = await client.getUnit(unitId, false, Bill);

  if (!bill) {
    throw new Error("Bill does not exist");
  }

  const splitBillTransactionOrder = await SplitBill.create({
    splits: [
      {
        value: amount,
        ownerPredicate: PayToPublicKeyHashPredicate.create(recipient),
      },
    ],
    bill,
    ...createTransactionData(round, feeCreditRecordId),
  }).sign(proofFactory, proofFactory);

  return await client.sendTransaction(splitBillTransactionOrder);
};

export const splitFungibleToken = async (
  privateKey: Uint8Array,
  amount: bigint,
  recipient: Uint8Array,
  tokenId: Uint8Array,
) => {
  const signingService = new DefaultSigningService(privateKey);
  const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL),
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD);
  const unitId = units.findLast((id) => compareArray(id.bytes, tokenId));
  const round = await client.getRoundNumber();

  if (!unitId) {
    throw new Error("Error fetching unitId");
  }

  if (!feeCreditRecordId) {
    throw new Error("Error fetching fee credit record");
  }

  const token = await client.getUnit(unitId, false, FungibleToken);

  if (!token) {
    throw new Error("Token does not exist");
  }

  const splitFungibleTokenTransactionOrder = await SplitFungibleToken.create({
    token,
    ownerPredicate: PayToPublicKeyHashPredicate.create(recipient),
    amount: amount,
    type: { unitId: token.typeId },
    ...createTransactionData(round, feeCreditRecordId),
  }).sign(proofFactory, proofFactory, []);

  return await client.sendTransaction(splitFungibleTokenTransactionOrder);
};

export const transferNFT = async (privateKey: Uint8Array, nftId: Uint8Array, recipient: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL),
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD);
  const unitId = units.findLast((id) => compareArray(id.bytes, nftId));
  const round = await client.getRoundNumber();

  if (!unitId) {
    throw new Error("Invalid nft id");
  }

  if (!feeCreditRecordId) {
    throw new Error("Error fetching fee credit record");
  }

  const nft = await client.getUnit(unitId, false, NonFungibleToken);

  if (!nft) {
    throw new Error("NFT does not exist");
  }

  const transferNonFungibleTokenTransactionOrder = await TransferNonFungibleToken.create({
    token: nft,
    ownerPredicate: PayToPublicKeyHashPredicate.create(recipient),
    nonce: null,
    type: { unitId: nft.typeId },
    counter: nft.counter,
    ...createTransactionData(round, feeCreditRecordId),
  }).sign(proofFactory, proofFactory, []);

  return await client.sendTransaction(transferNonFungibleTokenTransactionOrder);
};

export const swapBill = async (privateKey: Uint8Array, targetBillId: Uint8Array, billsToSwapIds: Uint8Array[]) => {
  const signingService = new DefaultSigningService(privateKey);
  const proofFactory = new PayToPublicKeyHashProofFactory(signingService);

  const client = createMoneyClient({
    transport: http(MONEY_BACKEND_URL),
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);

  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD);
  if (!feeCreditRecordId) {
    throw new Error("Error fetching fee credit record id");
  }

  const targetUnitId = units.find((id) => compareArray(id.bytes, targetBillId));
  if (!targetUnitId) {
    throw new Error("Error fetching target unit");
  }

  const targetBill = await client.getUnit(targetUnitId, false, Bill);
  if (!targetBill) {
    throw new Error("Error fetching target bill");
  }

  const billsIdsFiltered = billsToSwapIds.filter((id) => !compareArray(id, targetBillId));

  const billsToSwap = await Promise.all(
    billsIdsFiltered.map(async (billId) => {
      const unitId = units.find((id) => compareArray(id.bytes, billId));
      if (!unitId) {
        throw new Error("Error fetching bill for consolidation");
      }

      const bill = await client.getUnit(unitId, false, Bill);
      if (!bill) {
        throw new Error("Error fetching bill");
      }

      return bill;
    }),
  );

  const round = await client.getRoundNumber();

  const proofsToSwap = await Promise.all(
    billsToSwap.map(async (bill) => {
      const transferBillToDustCollectorTransactionOrder = await TransferBillToDustCollector.create({
        bill,
        targetBill,
        ...createTransactionData(round, feeCreditRecordId),
      }).sign(proofFactory, proofFactory);
      const transferBillToDustCollectorHash = await client.sendTransaction(transferBillToDustCollectorTransactionOrder);

      const proof = await client.getTransactionProof(transferBillToDustCollectorHash, TransferBillToDustCollector);

      if (!proof) {
        throw new Error("Error fetching transaction proof");
      }

      return proof;
    }),
  );

  const swapBillsWithDustCollectorTransactionOrder = await SwapBillsWithDustCollector.create({
    proofs: proofsToSwap,
    bill: targetBill,
    ...createTransactionData(round, feeCreditRecordId),
  }).sign(proofFactory, proofFactory);

  return await client.sendTransaction(swapBillsWithDustCollectorTransactionOrder);
};

export function createTransactionData(round: bigint, feeCreditRecordId?: IUnitId): ITransactionData {
  return {
    version: 1n, // TODO: let user specify version
    networkIdentifier: NetworkIdentifier.TESTNET,
    stateLock: null,
    metadata: createMetadata(round, feeCreditRecordId),
    stateUnlock: new AlwaysTruePredicate(),
  };
}

export function createMetadata(round: bigint, feeCreditRecordId?: IUnitId): ITransactionClientMetadata {
  return new ClientMetadata(5n, round + 60n, feeCreditRecordId ?? null, new Uint8Array());
}

// IMG REQUESTS

export const getImageUrl = async (url?: string): Promise<{ error: string | null; imageUrl: string | null }> => {
  if (!url) {
    return { error: "Missing image URL", imageUrl: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort("Timeout reached");
  }, 3000);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    if (response.ok) {
      const contentLength = response.headers.get("content-length");
      const contentType = response.headers.get("content-type");

      if (contentLength && Number(contentLength) > MaxImageSize) {
        return { error: "Image size exceeds 5MB limit", imageUrl: null };
      }

      if (contentType && contentType.startsWith("image/")) {
        return { imageUrl: url, error: null };
      }
    }
    return { error: "Invalid image URL", imageUrl: null };
  } catch (error) {
    console.error("Request cancelled:", error);
    return { error: "Failed to fetch image", imageUrl: null };
  } finally {
    clearTimeout(timeout);
  }
};

export const getImageUrlAndDownloadType = async (
  url?: string,
): Promise<{
  imageUrl: string | null;
  downloadType: string | null;
  error?: string | null;
} | null> => {
  if (!url) {
    return { error: "Missing image URL", downloadType: null, imageUrl: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort("Timeout reached");
  }, 3000);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    if (response.ok) {
      const contentLength = response.headers.get("content-length");
      const contentType = response.headers.get("content-type");

      if (contentLength && Number(contentLength) > MaxImageSize) {
        return {
          imageUrl: null,
          downloadType: null,
          error: "Image size exceeds 5MB limit",
        };
      }

      if (contentType && !DownloadableTypes.includes(contentType)) {
        return {
          imageUrl: null,
          downloadType: null,
          error: "Unsupported image format",
        };
      }

      return { imageUrl: url, downloadType: contentType, error: null };
    }
    return { error: "Invalid image URL", downloadType: null, imageUrl: null };
  } catch (error) {
    if (controller.signal.aborted) {
      console.error("Request cancelled:", error);
      return { error: "Request timeout", imageUrl: null, downloadType: null };
    }
    return { error: "Failed to fetch image", imageUrl: null, downloadType: null };
  } finally {
    clearTimeout(timeout);
  }
};

export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};
