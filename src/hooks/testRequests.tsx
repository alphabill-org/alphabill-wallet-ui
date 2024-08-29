import { CborCodecNode } from '@alphabill/alphabill-js-sdk/lib/codec/cbor/CborCodecNode.js';
import { DefaultSigningService } from '@alphabill/alphabill-js-sdk/lib/signing/DefaultSigningService.js';
import { createTokenClient, http } from '@alphabill/alphabill-js-sdk/lib/StateApiClientFactory.js';
import { AlwaysTruePredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/AlwaysTruePredicate.js';
import { TokenIcon } from '@alphabill/alphabill-js-sdk/lib/transaction/TokenIcon.js';
import { TransactionOrderFactory } from '@alphabill/alphabill-js-sdk/lib/transaction/TransactionOrderFactory.js';
import { UnitIdWithType } from '@alphabill/alphabill-js-sdk/lib/transaction/UnitIdWithType.js';
import { UnitType } from '@alphabill/alphabill-js-sdk/lib/transaction/UnitType.js';
import { Base16Converter } from '@alphabill/alphabill-js-sdk/lib/util/Base16Converter.js';
import { StateApiMoneyClient } from '@alphabill/alphabill-js-sdk/lib/StateApiMoneyClient.js';
import { StateApiTokenClient } from '@alphabill/alphabill-js-sdk/lib/StateApiTokenClient.js';
import { TransactionRecordWithProof } from '@alphabill/alphabill-js-sdk/lib/TransactionRecordWithProof.js';
import { TransactionPayload } from '@alphabill/alphabill-js-sdk/lib/transaction/TransactionPayload.js';
import { ITransactionPayloadAttributes } from '@alphabill/alphabill-js-sdk/lib/transaction/ITransactionPayloadAttributes.js';
import { TokenUnitIdFactory } from '@alphabill/alphabill-js-sdk/lib/transaction/TokenUnitIdFactory';
import { PayToPublicKeyHashPredicate } from '@alphabill/alphabill-js-sdk/lib/transaction/PayToPublicKeyHashPredicate';
import { NonFungibleTokenData } from '@alphabill/alphabill-js-sdk/lib/transaction/NonFungibleTokenData.js';

export const MONEY_BACKEND_URL = import.meta.env.VITE_MONEY_BACKEND_URL;
export const TOKENS_BACKEND_URL = import.meta.env.VITE_TOKENS_BACKEND_URL;

export enum TokenUnitType {
  FUNGIBLE = "fungible",
  NON_FUNGIBLE = "nft"
}

const cborCodec = new CborCodecNode();

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

export const createFungibleTokenType = async(privateKey: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  const transactionOrderFactory = new TransactionOrderFactory(cborCodec, signingService);

  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL, cborCodec),
    transactionOrderFactory: transactionOrderFactory,
    tokenUnitIdFactory: new TokenUnitIdFactory(cborCodec)
  });

  const feeCreditRecordId = (await client.getUnitsByOwnerId(signingService.publicKey)).findLast(
    (id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD,
  );

  if(!feeCreditRecordId){
    throw new Error("Error fetching unit fee credit record")
  }
  
  const round = await client.getRoundNumber();

  const tokenTypeUnitId = new UnitIdWithType(new Uint8Array([1, 2, 5]), UnitType.TOKEN_PARTITION_FUNGIBLE_TOKEN_TYPE);

  const createFungibleTokenTypeHash = await client.createFungibleTokenType(
    {
      type: { unitId: tokenTypeUnitId },
      symbol: 'T',
      name: 'T - Token',
      icon: new TokenIcon('image/png', new Uint8Array()),
      parentTypeId: null,
      decimalPlaces: 8,
      subTypeCreationPredicate: new AlwaysTruePredicate(),
      tokenCreationPredicate: new AlwaysTruePredicate(),
      invariantPredicate: new AlwaysTruePredicate(),
      subTypeCreationPredicateSignatures: null,
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId,
      referenceNumber: null
    },
  );
  console.log((await waitTransactionProof(client, createFungibleTokenTypeHash))?.toString());
}

export const createFungibleToken = async(privateKey: Uint8Array) => {
  const signingService = new DefaultSigningService(privateKey);
  const transactionOrderFactory = new TransactionOrderFactory(cborCodec, signingService);
  const tokenUnitIdFactory = new TokenUnitIdFactory(cborCodec);

  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL, cborCodec),
    transactionOrderFactory: transactionOrderFactory,
    tokenUnitIdFactory: tokenUnitIdFactory,
  });

  const feeCreditRecordId = (await client.getUnitsByOwnerId(signingService.publicKey)).findLast(
    (id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD,
  );

  if(!feeCreditRecordId){
    throw new Error("Error fetching unit fee credit record")
  }

  const round = await client.getRoundNumber();
  const units = await client.getUnitsByOwnerId(signingService.publicKey);

  let tokenTypeUnitId = units.find((id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FUNGIBLE_TOKEN_TYPE)

  if(!tokenTypeUnitId){
    tokenTypeUnitId = new UnitIdWithType(new Uint8Array([1, 2, 5]), UnitType.TOKEN_PARTITION_FUNGIBLE_TOKEN_TYPE);
  } 

  const createFungibleTokenHash = await client.createFungibleToken(
    {
      ownerPredicate: await PayToPublicKeyHashPredicate.create(cborCodec, signingService.publicKey),
      type: {unitId: tokenTypeUnitId},
      value: 100000000000000n,
      nonce: 0n,
      tokenCreationPredicateSignatures: [null],
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId,
      referenceNumber: null
    },
  );
  console.log((await waitTransactionProof(client, createFungibleTokenHash))?.toString());
}

export const createNFT = async (privateKey: string) => {
  const signingService = new DefaultSigningService(Base16Converter.decode(privateKey));
  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    tokenUnitIdFactory: new TokenUnitIdFactory(cborCodec)
  });

  const feeCreditRecordId = (await client.getUnitsByOwnerId(signingService.publicKey)).findLast(
    (id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD,
  );
  const round = await client.getRoundNumber();
  const tokenTypeUnitId = new UnitIdWithType(new Uint8Array([1, 2, 3]), UnitType.TOKEN_PARTITION_NON_FUNGIBLE_TOKEN_TYPE);
  
  const createNonFungibleTokenHash = await client.createNonFungibleToken(
    {
      ownerPredicate: await PayToPublicKeyHashPredicate.create(cborCodec, signingService.publicKey),
      type: { unitId: tokenTypeUnitId },
      name: 'Potatoz',
      uri: 'http://guardtime.com',
      data: await NonFungibleTokenData.create(cborCodec, [
        'user variables as primitives',
        10000,
        [true, new Uint8Array()],
      ]),
      dataUpdatePredicate: new AlwaysTruePredicate(),
      nonce: 0n,
      tokenCreationPredicateSignatures: [null],
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId,
    },
  );
  console.log((await waitTransactionProof(client, createNonFungibleTokenHash))?.toString());
}

export const createNFTType = async(privateKey: string) => {
  const signingService = new DefaultSigningService(Base16Converter.decode(privateKey));
  const client = createTokenClient({
    transport: http(TOKENS_BACKEND_URL, cborCodec),
    transactionOrderFactory: new TransactionOrderFactory(cborCodec, signingService),
    tokenUnitIdFactory: new TokenUnitIdFactory(cborCodec)
  });

  const feeCreditRecordId = (await client.getUnitsByOwnerId(signingService.publicKey)).findLast(
    (id) => id.type.toBase16() === UnitType.TOKEN_PARTITION_FEE_CREDIT_RECORD,
  );

  if(!feeCreditRecordId){
    throw new Error('No fee credit record was found!')
  }
  const round = await client.getRoundNumber();
  const tokenTypeUnitId = new UnitIdWithType(new Uint8Array([1, 2, 3]), UnitType.TOKEN_PARTITION_NON_FUNGIBLE_TOKEN_TYPE);
  
  const createNonFungibleTokenTypeHash = await client.createNonFungibleTokenType(
    {
      type: { unitId: tokenTypeUnitId },
      symbol: 'NN',
      name: 'Potatoz',
      icon: { type: 'image/png', data: new Uint8Array() },
      parentTypeId: null,
      subTypeCreationPredicate: new AlwaysTruePredicate(),
      tokenCreationPredicate: new AlwaysTruePredicate(),
      invariantPredicate: new AlwaysTruePredicate(),
      dataUpdatePredicate: new AlwaysTruePredicate(),
      subTypeCreationPredicateSignatures: null,
    },
    {
      maxTransactionFee: 5n,
      timeout: round + 60n,
      feeCreditRecordId,
      referenceNumber: null
    },
  );
  console.log((await waitTransactionProof(client, createNonFungibleTokenTypeHash))?.toString());


}