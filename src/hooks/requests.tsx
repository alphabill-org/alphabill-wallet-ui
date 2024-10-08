import axios, { isCancel } from "axios";
import { encodeAsync } from "cbor";
import { createMoneyClient, createTokenClient, http } from '@alphabill/alphabill-js-sdk/lib/StateApiClientFactory.js';
import { CborCodecWeb } from '@alphabill/alphabill-js-sdk/lib/codec/cbor/CborCodecWeb.js';
import { TransactionOrderFactory } from '@alphabill/alphabill-js-sdk/lib/transaction/TransactionOrderFactory.js';
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";
import { Base64Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base64Converter";
import { FungibleToken } from "@alphabill/alphabill-js-sdk/lib/FungibleToken";
import { FungibleTokenType } from "@alphabill/alphabill-js-sdk/lib/FungibleTokenType";
import { NonFungibleToken } from "@alphabill/alphabill-js-sdk/lib/NonFungibleToken";
import { NonFungibleTokenType } from "@alphabill/alphabill-js-sdk/lib/NonFungibleTokenType";
import { ITransactionPayload, IBill, IListTokensResponse, ITypeHierarchy, IBalance,IFeeCreditBills } from "../types/Types";
import { AlphaType, DownloadableTypes, MaxImageSize, TokenType } from "../utils/constants";
import { addDecimal, separateDigits } from "../utils/utils";
import { FeeCreditRecordUnitIdFactory } from "@alphabill/alphabill-js-sdk/lib/transaction/FeeCreditRecordUnitIdFactory";
import { TokenUnitIdFactory } from "@alphabill/alphabill-js-sdk/lib/transaction/TokenUnitIdFactory";
import { UnitType } from "@alphabill/alphabill-js-sdk/lib/transaction/UnitType";
import { Bill } from "@alphabill/alphabill-js-sdk/lib/Bill";
import { IUnitId } from "@alphabill/alphabill-js-sdk/lib/IUnitId";
import { TransactionRecordWithProof } from "@alphabill/alphabill-js-sdk/lib/TransactionRecordWithProof";
import { TransactionPayload } from "@alphabill/alphabill-js-sdk/lib/transaction/TransactionPayload";
import { ITransactionPayloadAttributes } from "@alphabill/alphabill-js-sdk/lib/transaction/ITransactionPayloadAttributes";
import { StateApiMoneyClient } from "@alphabill/alphabill-js-sdk/lib/StateApiMoneyClient";
import { StateApiTokenClient } from "@alphabill/alphabill-js-sdk/lib/StateApiTokenClient";
import { IUnit } from "@alphabill/alphabill-js-sdk/lib/IUnit";
import { FeeCreditRecord } from "@alphabill/alphabill-js-sdk/lib/FeeCreditRecord";
import { DefaultSigningService } from '@alphabill/alphabill-js-sdk/lib/signing/DefaultSigningService.js';
import { SystemIdentifier } from "@alphabill/alphabill-js-sdk/lib/SystemIdentifier";
import { PayToPublicKeyHashPredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/PayToPublicKeyHashPredicate.js';
import { UnitIdWithType } from '@alphabill/alphabill-js-sdk/lib/transaction/UnitIdWithType.js';
import { TransferFeeCreditAttributes } from "@alphabill/alphabill-js-sdk/lib/transaction/TransferFeeCreditAttributes";
import { CloseFeeCreditAttributes } from "@alphabill/alphabill-js-sdk/lib/transaction/CloseFeeCreditAttributes";
import { TransferBillToDustCollectorAttributes } from "@alphabill/alphabill-js-sdk/lib/transaction/TransferBillToDustCollectorAttributes";

export const MONEY_BACKEND_URL = import.meta.env.VITE_MONEY_BACKEND_URL;
export const TOKENS_BACKEND_URL = import.meta.env.VITE_TOKENS_BACKEND_URL;

export enum TokenUnitType {
  FUNGIBLE = "fungible",
  NON_FUNGIBLE = "nft"
}

const cborCodec = new CborCodecWeb();
const feeCreditRecordUnitIdFactory = new FeeCreditRecordUnitIdFactory();
const tokenUnitIdFactory = new TokenUnitIdFactory(cborCodec);

const moneyClient = createMoneyClient({
  transport: http(MONEY_BACKEND_URL, cborCodec),
  transactionOrderFactory: null as unknown as TransactionOrderFactory,
  feeCreditRecordUnitIdFactory: feeCreditRecordUnitIdFactory
});

const tokenClient = createTokenClient({
  transport: http(TOKENS_BACKEND_URL, cborCodec),
  transactionOrderFactory: null as unknown as TransactionOrderFactory,
  tokenUnitIdFactory: tokenUnitIdFactory
});


// ADDITIONAL METHODS

const getUnitsIdListByType = async (
  pubKey: string, 
  type: UnitType,
  client: StateApiMoneyClient | StateApiTokenClient
): Promise<IUnitId[] | undefined> => {
  if(!pubKey) return
  try {
    const units = await client.getUnitsByOwnerId(Base16Converter.decode(pubKey));
    const idList = units.filter((unit) => unit.type.toBase16() === type);
    return idList;
  } catch(error) {
    console.error('Error fetching units:', error);
    return;
  }
}       

const fetchFeeCredit = async(
  pubKey: string,
  client: StateApiTokenClient | StateApiMoneyClient,
  type: UnitType
) : Promise<FeeCreditRecord | null> => {
  try {
    const units = await client.getUnitsByOwnerId(Base16Converter.decode(pubKey));
    const unitId = units.findLast((unit) => unit.type.toBase16() === type);

    if(!unitId) return null;

    return client.getUnit(unitId, true) as Promise<FeeCreditRecord | null>
  } catch(error) {
    console.error('Error fetching fee credit: ', error);
    return null;
  }
};

function waitTransactionProof (
  client: StateApiMoneyClient | StateApiTokenClient, 
  txHash: Uint8Array,
  timeout = 10000,
  interval = 1000
):Promise<TransactionRecordWithProof<TransactionPayload<ITransactionPayloadAttributes>>> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const poller = async () => {
      const proof = await client.getTransactionProof(txHash);
      if (proof !== null) {
        return resolve(proof);
      }

      if (Date.now() > start + timeout) {
        return reject('Timeout');
      }

      setTimeout(poller, interval);
    };
    poller();
  });
}

const getPartition = (
    client: StateApiMoneyClient | StateApiTokenClient,
    isAlpha?: boolean, 
  ) => {
  return {
    client: client,
    systemIdentifier: isAlpha ? SystemIdentifier.MONEY_PARTITION : SystemIdentifier.TOKEN_PARTITION,
    unitType: isAlpha ? UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD : UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD
  }
}

const compareArray = (a: Uint8Array, b: Uint8Array) => {
  if(a.length !== b.length) return false;
  for(let i = 0; i < a.length; i++){
    if(a[i] !== b[i]) return false;
  }
  return true;
}


// SDK IMPLEMENTATION 

export const getBalance = async (
  pubKey: string
): Promise<IBalance | undefined> => {
  const idList = await getUnitsIdListByType(pubKey, UnitType.MONEY_PARTITION_BILL_DATA, moneyClient);
  if(!idList || idList.length <= 0) return;

  let balance = 0;
  try {
    for(const id of idList){
      const bill = await moneyClient.getUnit(id, false) as unknown as Bill | null;
      balance += bill ? Number(bill?.value) : 0;
    }
    return {balance, pubKey};
  } catch(error) {
    console.error('Error fetching units values:', error);
    return
  }
};

export const getBillsList = async (
  pubKey: string,
): Promise<IBill[] | undefined> => {
  const idList = await getUnitsIdListByType(pubKey, UnitType.MONEY_PARTITION_BILL_DATA, moneyClient);
  if(!idList || idList.length <= 0) return;
  const billsList: IBill[] = [];
  try {
    for(const id of idList){
      const bill = await moneyClient.getUnit(id, true) as unknown as Bill | null;
      if(bill){
        billsList.push({
          id: Base16Converter.encode(id.bytes),
          value: bill.value.toString(),
          txHash: Base16Converter.encode(bill.stateProof?.unitLedgerHash ?? new Uint8Array()),
          typeId: AlphaType,
        });
      }
    }
    return billsList;
  } catch(error) {
    console.error('Error fetching unit by id:', error);
    return;
  }
};

export const getTypeHierarchy = async (typeId: string) => {

  if(!typeId) return;
  
  // const unit = await tokenClient.getUnit(typeId, false);

  // tokenClient.
  
  const response = await axios.get<ITypeHierarchy[]>(
    `${TOKENS_BACKEND_URL}/types/${typeId}/hierarchy`
  );

  return response.data;
};

export const getUserTokens = async (
  pubKey: string,
  kind: TokenUnitType,
  activeAsset?: string
): Promise<IListTokensResponse[]> => {
  let type: UnitType;
  switch (kind) {
      case TokenUnitType.FUNGIBLE:
          type = UnitType.TOKEN_PARTITION_FUNGIBLE_TOKEN;
          break;
      case TokenUnitType.NON_FUNGIBLE:
          type = UnitType.TOKEN_PARTITION_NON_FUNGIBLE_TOKEN;
          break;
      default:
          throw new Error("Unsupported token");
  }
  const list = await getUnitsIdListByType(pubKey, type, tokenClient);
  if(!list || list.length <= 0){
    return [];
  }

  const tokens: IListTokensResponse[] = [];
  const tokenTypes = new Map<string, IUnit>();
  for (const id of list) {
      const unit = await tokenClient.getUnit(id, true) as { tokenType: IUnitId } | null;
      if (!unit) {
          continue;
      }

      const typeUnitKey = Base16Converter.encode(unit.tokenType.bytes)
      let typeUnit: IUnit | null = tokenTypes.get(typeUnitKey) ?? null;
      if (!typeUnit) {
          typeUnit = await tokenClient.getUnit(unit.tokenType, false);
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
                  typeId: Base64Converter.encode(token.tokenType.bytes),
                  owner: Base64Converter.encode(token.ownerPredicate.bytes),
                  kind: 2,
                  txHash: Base16Converter.encode(token.stateProof?.unitLedgerHash ?? new Uint8Array()),
                  symbol: tokenType.symbol,
                  network: import.meta.env.VITE_NETWORK_NAME,
                  decimals: tokenType.decimalPlaces,
                  amount: token.value.toString(),
                  UIAmount: separateDigits(addDecimal(token.value.toString(), tokenType.decimalPlaces)),
                  value: token.value.toString(),
                  icon: tokenType.icon,
                  invariantPredicate: Base64Converter.encode(tokenType.invariantPredicate.bytes)

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


export const getProof = async (
  txHash: Uint8Array,
  isAlpha?: boolean,
  timeout = 10000,
  interval = 1000
): Promise<TransactionRecordWithProof<TransactionPayload<ITransactionPayloadAttributes>> | null> => {
  const client = isAlpha ? moneyClient : tokenClient;
  
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const poller = async () => {
      const proof = await client.getTransactionProof(txHash);
      if (proof !== null) {
        return resolve(proof);
      }
      console.log(txHash, "TX HASH AT PROOF")
      console.log(proof)
      if (Date.now() > start + timeout) {
        return reject('Timeout');
      }

      setTimeout(poller, interval);
    };

    poller();
  });
};

export const getRoundNumber = async (isAlpha: boolean): Promise<bigint | null> => {
  const client = isAlpha ? moneyClient : tokenClient;

  try {  
    return client.getRoundNumber();
  } catch(error) {
    console.error('Error fetching round number:', error);
    return null;
  }
};

export const makeTransaction = async (
  data: any,
  pubKey: string,
  isAlpha?: boolean
): Promise<{
  data: ITransactionPayload;
}> => {
  const url = isAlpha ? MONEY_BACKEND_URL : TOKENS_BACKEND_URL;
  const encodedData = await encodeAsync([[data]], {canonical: true});
  const response = await axios.post<{
    data: ITransactionPayload;
  }>(`${url}/transactions/${pubKey}`, encodedData, {
    headers: {
      "Content-Type": "application/cbor",
    },
  });

  return response.data;
};

export const getFeeCreditBills = async (
  pubKey: string
): Promise<IFeeCreditBills | undefined> => {
  if (!pubKey) return;

  const [moneyFeeCredit, tokenFeeCredit] = await Promise.all([
    fetchFeeCredit(pubKey, moneyClient, UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD),
    fetchFeeCredit(pubKey, tokenClient, UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD),
  ]);

  const formatFeeCredit = (feeCredit: FeeCreditRecord | null) => feeCredit ? {
    id: Base64Converter.encode(feeCredit.unitId.bytes),
    value: feeCredit.balance.toString(),
    txHash: Base64Converter.encode(feeCredit.stateProof!.unitLedgerHash),
    lastAddFcTxHash: Base64Converter.encode(feeCredit.stateProof!.unitTreeCert.transactionRecordHash)
  } : null;

  return {
    [AlphaType] : formatFeeCredit(moneyFeeCredit),
    [TokenType] : formatFeeCredit(tokenFeeCredit),
  };
};

export const addFeeCredit = async(privateKey: Uint8Array, amount: bigint, billId: Uint8Array, isAlpha?: boolean) => {
  const signingService = new DefaultSigningService(privateKey);
  
  const moneyClientFee = createMoneyClient({
    transport: http(MONEY_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    feeCreditRecordUnitIdFactory: feeCreditRecordUnitIdFactory,
  })

  const client = isAlpha 
    ? moneyClientFee
    : createTokenClient({
        transport: http(TOKENS_BACKEND_URL, cborCodec),
        transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
        tokenUnitIdFactory: tokenUnitIdFactory,
      })

  const units = await moneyClient.getUnitsByOwnerId(signingService.publicKey);
  const unitId = units.find((id) => compareArray(id.bytes, billId))

  if(!unitId){
    throw new Error('No bills available');
  }

  const partition = getPartition(client, isAlpha);


  const bill = await moneyClientFee.getUnit(unitId, false) as Bill;
  const round = await moneyClientFee.getRoundNumber();
  const ownerPredicate = await PayToPublicKeyHashPredicate.create(cborCodec, signingService.publicKey);

  let transferToFeeCreditHash = await moneyClientFee.transferToFeeCredit(
    {
      bill,
      amount: amount,
      systemIdentifier: partition.systemIdentifier,
      feeCreditRecordParams: {
        ownerPredicate: ownerPredicate,
        unitType: partition.unitType as UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD | UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD,
      },
      latestAdditionTime: round + 60n,
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId: null,
      referenceNumber: null,
    },
  );

    let proof = await waitTransactionProof(moneyClientFee, transferToFeeCreditHash) as TransactionRecordWithProof<TransactionPayload<TransferFeeCreditAttributes>>;
    const feeCreditRecordUnitId = proof.transactionRecord.transactionOrder.payload.attributes.targetUnitId;
    const feeCreditRecordId = new UnitIdWithType(feeCreditRecordUnitId.bytes, partition.unitType);

  let addFeeCreditHash = await partition.client.addFeeCredit(
    {
      ownerPredicate: ownerPredicate,
      proof,
      feeCreditRecord: { unitId: feeCreditRecordId },
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId: null,
      referenceNumber: null
    },
  );

  return addFeeCreditHash
}

export const reclaimFeeCredit = async(privateKey: Uint8Array, isAlpha?: boolean) => {
  const signingService = new DefaultSigningService(privateKey);
  
  const moneyClientReclaim = createMoneyClient({
    transport: http(MONEY_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    feeCreditRecordUnitIdFactory: feeCreditRecordUnitIdFactory
  });
  
  const client = isAlpha
    ? moneyClientReclaim
    : createTokenClient({
        transport: http(TOKENS_BACKEND_URL, cborCodec),
        transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
        tokenUnitIdFactory: tokenUnitIdFactory,
      }) 

  const units = await client.getUnitsByOwnerId(signingService.publicKey);

  const unitsMoney = !isAlpha 
    ? await moneyClientReclaim.getUnitsByOwnerId(signingService.publicKey)
    : [];

  const targetBillId = isAlpha
   ? units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_BILL_DATA)
   : unitsMoney.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_BILL_DATA);
  
  const feeCreditRecordId = isAlpha
    ? units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD)
    : units.findLast((id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD);

  if(!feeCreditRecordId) {
    throw new Error('No fee credit available');
  }

  if(!targetBillId){
    throw new Error('No bills were found')
  }

  const bill = await moneyClientReclaim.getUnit(targetBillId, false) as Bill;
  const feeCreditRecord = await client.getUnit(feeCreditRecordId, false) as FeeCreditRecord;
  const round = await client.getRoundNumber();

  const closeFeeCreditHash = await client.closeFeeCredit(
    {
      bill,
      feeCreditRecord
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId: null,
      referenceNumber: null
    }
  )

  const proof = await waitTransactionProof(client, closeFeeCreditHash) as TransactionRecordWithProof<TransactionPayload<CloseFeeCreditAttributes>>;

  const reclaimFeeCreditHash = await moneyClientReclaim.reclaimFeeCredit(
    {
      proof,
      bill
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId: null,
      referenceNumber: null
    }
  )

  return reclaimFeeCreditHash;
}

export const transferBill = async(privateKey: Uint8Array, recipient: Uint8Array, billId: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  const client = createMoneyClient({
    transport: http(MONEY_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    feeCreditRecordUnitIdFactory: feeCreditRecordUnitIdFactory,
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD) ?? null;
  const unitId = units.findLast((id) => compareArray(id.bytes, billId));

  if(!unitId) {
    throw new Error("No bills were found")
  }

  const round = await client.getRoundNumber();
  const bill = await client.getUnit(unitId, false) as Bill;

  const transferBillHash = await client.transferBill({
      ownerPredicate: await PayToPublicKeyHashPredicate.create(cborCodec, recipient),
      bill,
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId,
      referenceNumber: null
    }
  );

  return transferBillHash
}

export const transferFungibleToken = async(privateKey: Uint8Array, recipient: Uint8Array, tokenId: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    tokenUnitIdFactory: tokenUnitIdFactory
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD);
  const unitId = units.findLast((id) => compareArray(id.bytes, tokenId));
  const round = await client.getRoundNumber();

  if(!feeCreditRecordId) {
    throw new Error('No fee credit available');
  }

  if(!unitId){
    throw new Error('Error fetching fungible tokens')
  }

  const token = await client.getUnit(unitId, false) as FungibleToken;

  if(!token){
    throw new Error('Token does not exist')
  }

  const transferFungibleTokenHash = await client.transferFungibleToken({
      token,
      ownerPredicate: await PayToPublicKeyHashPredicate.create(cborCodec, recipient),
      nonce: null,
      type: {unitId: token.tokenType},
      invariantPredicateSignatures: [null]
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId: feeCreditRecordId,
      referenceNumber: null
    }
  )

  return transferFungibleTokenHash
}

export const splitBill = async(
  privateKey: Uint8Array, 
  amount: bigint, 
  recipient: Uint8Array,
  billId: Uint8Array
) => {
  const signingService = new DefaultSigningService(privateKey);

  const client = createMoneyClient({
    transport: http(MONEY_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    feeCreditRecordUnitIdFactory: feeCreditRecordUnitIdFactory
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD);
  const unitId = units.findLast((id) => compareArray(id.bytes, billId));
  const round = await client.getRoundNumber();

  if(!unitId){
    throw new Error('Error fetching unitId');
  }

  if(!feeCreditRecordId){
    throw new Error('Error fetching fee credit record');
  }

  const bill = await client.getUnit(unitId, false) as Bill;

  const splitBillHash = await client.splitBill(
    {
      splits: [
        {
          value: amount,
          ownerPredicate: await PayToPublicKeyHashPredicate.create(cborCodec, recipient)
        }
      ],
      bill
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId,
      referenceNumber: null
    }
  );

  return splitBillHash;
}

export const splitFungibleToken = async(
  privateKey: Uint8Array, 
  amount: bigint, 
  recipient: Uint8Array, 
  tokenId: Uint8Array
) => {
  const signingService = new DefaultSigningService(privateKey);

  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    tokenUnitIdFactory: tokenUnitIdFactory
  })

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD);
  const unitId = units.findLast((id) => compareArray(id.bytes, tokenId));
  const round = await client.getRoundNumber();

  if(!unitId){
    throw new Error('Error fetching unitId');
  }

  if(!feeCreditRecordId){
    throw new Error('Error fetching fee credit record');
  }

  const token = await client.getUnit(unitId, false) as FungibleToken;

  const splitFungibleTokenHash = await client.splitFungibleToken(
    {
      token,
      ownerPredicate: await PayToPublicKeyHashPredicate.create(cborCodec, recipient),
      amount: amount,
      nonce: null,
      type: { unitId: token.tokenType },
      invariantPredicateSignatures: [null],
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId,
      referenceNumber: null
    },
  );

  return splitFungibleTokenHash;
}

export const transferNFT = async(privateKey: Uint8Array, nftId: Uint8Array, recipient: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  
  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    tokenUnitIdFactory: tokenUnitIdFactory
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);
  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD);
  const unitId = units.findLast((id) => compareArray(id.bytes, nftId));
  const round = await client.getRoundNumber();

  if(!unitId){
    throw new Error("Invalid nft id")
  }

  if(!feeCreditRecordId){
    throw new Error("Error fetching fee credit record")
  }

  const nft = await client.getUnit(unitId, false) as NonFungibleToken;

  if(!nft){
    throw new Error("NFT does not exist")
  }

  const transferNFTHash = await client.transferNonFungibleToken(
    {
      token: nft,
      ownerPredicate: await PayToPublicKeyHashPredicate.create(cborCodec, recipient),
      nonce: null,
      type: {unitId: nft.tokenType},
      invariantPredicateSignatures: [null],
      counter: nft.counter
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId,
      referenceNumber: null
    }
  );

  return transferNFTHash;
}

export const swapBill = async(
  privateKey: Uint8Array,
  targetBillId: Uint8Array,
  billsToSwapIds: Uint8Array[]
) => {
  const signingService = new DefaultSigningService(privateKey);
  const client = createMoneyClient({
    transport: http(MONEY_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    feeCreditRecordUnitIdFactory: feeCreditRecordUnitIdFactory
  });

  const units = await client.getUnitsByOwnerId(signingService.publicKey);

  const feeCreditRecordId = units.findLast((id) => id.type.toBase16() === UnitType.MONEY_PARTITION_FEE_CREDIT_RECORD);
  if(!feeCreditRecordId){
    throw new Error("Error fetching fee credit record id");
  }

  const targetUnitId = units.find((id) => compareArray(id.bytes, targetBillId));
  if(!targetUnitId){
    throw new Error("Error fetching target unit");
  }

  const targetBill = await client.getUnit(targetUnitId, false) as Bill;
  if(!targetBill){
    throw new Error("Error fetching target bill");
  }

  const billsIdsFiltered = billsToSwapIds.filter((id) => !compareArray(id, targetBillId));

  const billsToSwap = await Promise.all(
    billsIdsFiltered.map(async(billId) => {
      const unitId = units.find((id) => compareArray(id.bytes, billId));
      if(!unitId){
        throw new Error("Error fetching bill for consolidation");
      }

      const bill = await client.getUnit(unitId, false) as Bill;
      if(!bill){
        throw new Error("Error fetching bill")
      }

      return bill
    })
  )

  const round = await client.getRoundNumber();

  const proofsToSwap = await Promise.all(
    billsToSwap.map(async(bill) => {
      const transferBillToDustCollectorHash = await client.transferBillToDustCollector(
        {
          bill,
          targetBill
        },
        {
          maxTransactionFee: 5n,
          timeout: round + 60n,
          feeCreditRecordId,
          referenceNumber: null
        }
      )

      const proof = await getProof(
        transferBillToDustCollectorHash, 
        true
      ) as TransactionRecordWithProof<TransactionPayload<TransferBillToDustCollectorAttributes>>;

      if(!proof){
        throw new Error("Error fetching transaction proof");
      }
      
      return proof
    })
  )

  const swapBillsWithDustCollectorHash = await client.swapBillsWithDustCollector(
    {
      bill: targetBill,
      ownerPredicate: await PayToPublicKeyHashPredicate.create(cborCodec, signingService.publicKey),
      proofs: proofsToSwap
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 100n,
      feeCreditRecordId,
      referenceNumber: null
    }
  )

  return swapBillsWithDustCollectorHash;
}


// IMG REQUESTS

export const getImageUrl = async (
  url?: string
): Promise<{ error: string | null; imageUrl: string | null }> => {
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
    if (isCancel(error)) {
      console.error("Request cancelled:", error.message);
    }
    return { error: "Failed to fetch image", imageUrl: null };
  } finally {
    clearTimeout(timeout);
  }
};

export const getImageUrlAndDownloadType = async (
  url?: string
): Promise<{
  imageUrl: string | null;
  downloadType: string | null;
  error?: string | null;
} | null> => {
  if (!url) {
    return {error: "Missing image URL", downloadType: null, imageUrl: null};
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
    return {error: "Invalid image URL", downloadType: null, imageUrl: null};
  } catch (error) {
    if(controller.signal.aborted) {
      console.error("Request cancelled:", error);
      return {error: "Request timeout", imageUrl: null, downloadType: null};
    }
    return {error: "Failed to fetch image", imageUrl: null, downloadType: null};
  } finally {
    clearTimeout(timeout);
  }
};

export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, {
      method: "GET",
    });

    if(!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch(error) {
    console.error("Error downloading file:", error);
  }
};