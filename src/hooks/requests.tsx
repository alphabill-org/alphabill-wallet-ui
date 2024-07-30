import axios, { AxiosResponse, isCancel } from "axios";
import { encodeAsync } from "cbor";
import { createMoneyClient, createTokenClient, http } from '@alphabill/alphabill-js-sdk/lib/StateApiClientFactory.js';
import { CborCodecWeb } from '@alphabill/alphabill-js-sdk/lib/codec/cbor/CborCodecWeb.js';
import { TransactionOrderFactory } from '@alphabill/alphabill-js-sdk/lib/transaction/TransactionOrderFactory.js';
import { Base16Converter } from "@alphabill/alphabill-js-sdk/lib/util/Base16Converter";

import {
  ITransactionPayload,
  IBill,
  IListTokensResponse,
  ITypeHierarchy,
  IBalance,
  IFeeCreditBills,
} from "../types/Types";
import {
  AlphaType,
  DownloadableTypes,
  MaxImageSize,
  moneyFeeCreditRecordUnitType,
  tokenFeeCreditRecordUnitType,
  TokenType,
} from "../utils/constants";
import {
  addDecimal,
  separateDigits,
} from "../utils/utils";
import { FeeCreditRecordUnitIdFactory } from "@alphabill/alphabill-js-sdk/lib/transaction/FeeCreditRecordUnitIdFactory";
import { TokenUnitIdFactory } from "@alphabill/alphabill-js-sdk/lib/transaction/TokenUnitIdFactory";
import { UnitType } from "@alphabill/alphabill-js-sdk/lib/transaction/UnitType";
import { Bill } from "@alphabill/alphabill-js-sdk/lib/Bill";
import { IUnitId } from "@alphabill/alphabill-js-sdk/lib/IUnitId";
import { TransactionRecordWithProof } from "@alphabill/alphabill-js-sdk/lib/TransactionRecordWithProof";
import { TransactionPayload } from "@alphabill/alphabill-js-sdk/lib/transaction/TransactionPayload";
import { ITransactionPayloadAttributes } from "@alphabill/alphabill-js-sdk/lib/transaction/ITransactionPayloadAttributes";

export const MONEY_BACKEND_URL = import.meta.env.VITE_MONEY_BACKEND_URL;
export const TOKENS_BACKEND_URL = import.meta.env.VITE_TOKENS_BACKEND_URL;

const cborCodec = new CborCodecWeb();
const moneyClient = createMoneyClient({
  transport: http(MONEY_BACKEND_URL, cborCodec),
  transactionOrderFactory: null as unknown as TransactionOrderFactory,
  feeCreditRecordUnitIdFactory: new FeeCreditRecordUnitIdFactory()
});

const tokenClient = createTokenClient({
  transport: http(TOKENS_BACKEND_URL, cborCodec),
  transactionOrderFactory: null as unknown as TransactionOrderFactory,
  tokenUnitIdFactory: new TokenUnitIdFactory(cborCodec)
});

const getUnitsIdListByType = async (
  pubKey: string, 
  type: UnitType
): Promise<IUnitId[] | undefined> => {
  try {
    const units = await moneyClient.getUnitsByOwnerId(pubKey ? Base16Converter.decode(pubKey) : new Uint8Array());
    const idList = units.filter((unit) => unit.type.toBase16() === type);
    return idList;
  } catch(error) {
    console.log('Error fetching units:', error)
    return undefined
  }
}

export const getBalance = async (
  pubKey: string
): Promise<IBalance | undefined> => {
  const idList = await getUnitsIdListByType(pubKey, UnitType.MONEY_PARTITION_BILL_DATA);
  if(!idList || idList.length <= 0){
    return {balance: 0, pubKey};
  }

  let balance = 0;

  try {
    for(const id of idList){
      const bill = await moneyClient.getUnit(id, false) as unknown as Bill | null;
      balance += bill ? Number(bill?.value) : 0;
    }
    return {balance, pubKey};
  } catch(error) {
    console.log('Error fetching units values:', error);
  }
};

export const getBillsList = async (
  pubKey: string,
): Promise<IBill[] | undefined> => {
  const idList = await getUnitsIdListByType(pubKey, UnitType.MONEY_PARTITION_BILL_DATA);
  if(!idList || idList.length <= 0){
    return []
  }

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
    console.log('Error fetching unit by id:', error);
    return undefined;
  }
  
};

export const fetchAllTypes = async (
  kind: string = "all",
  limit: number = 100,
  offsetKey: string = ""
) => {
  const types = [];
  let nextOffsetKey: string | null = offsetKey;

  while (nextOffsetKey !== null) {
    const response: AxiosResponse = await axios.get(
      TOKENS_BACKEND_URL +
        (nextOffsetKey
          ? nextOffsetKey.replace("/api/v1", "") // TOKENS_BACKEND_URL includes /api/v1
          : `/kinds/${kind}/types?limit=${limit}`)
    );

    const data = response.data;

    // Add types to the list
    data && types.push(...data);

    // Check if there is a "next" link in the response header
    const linkHeader = response.headers.link;

    if (linkHeader) {
      const nextLinkMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
      if (nextLinkMatch) {
        // Extract the next offset key from the link header
        nextOffsetKey = nextLinkMatch[1];
      } else {
        nextOffsetKey = null;
      }
    } else {
      nextOffsetKey = null;
    }
  }

  return types;
};

export const getTypeHierarchy = async (typeId: string) => {
  const response = await axios.get<ITypeHierarchy[]>(
    `${TOKENS_BACKEND_URL}/types/${typeId}/hierarchy`
  );

  return response.data;
};

export const getUserTokens = async (
  owner: string,
  kind: string,
  activeAsset?: string,
  limit = 100,
  offsetKey = ""
) => {
  if (
    !owner ||
    Number(owner) === 0 ||
    !Boolean(owner.match(/^0x[0-9A-Fa-f]{66}$/))
  ) {
    return;
  }

  const tokens: any = [];
  let nextOffsetKey: string | null = offsetKey;

  while (nextOffsetKey !== null) {
    const response: AxiosResponse = await axios.get(
      TOKENS_BACKEND_URL +
        (nextOffsetKey
          ? nextOffsetKey.replace("/api/v1", "") // TOKENS_BACKEND_URL includes /api/v1
          : `/kinds/${kind}/owners/${owner}/tokens?limit=${limit}`)
    );

    const data = response.data;

    // Add tokens to the list
    data && tokens?.push(...data);

    // Check if there is a "next" link in the response header
    const linkHeader = response.headers.link;

    if (linkHeader) {
      const nextLinkMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
      if (nextLinkMatch) {
        // Extract the next offset key from the link header
        nextOffsetKey = nextLinkMatch[1];
      } else {
        nextOffsetKey = null;
      }
    } else {
      nextOffsetKey = null;
    }
  }

  const updatedArray = await Promise.all(
    tokens?.map(async (obj: IListTokensResponse) => {
      const token: IListTokensResponse = {
        id: obj.id,
        typeId: obj.typeId,
        owner: obj.owner,
        kind: obj.kind,
        txHash: obj.txHash,
        symbol: obj.symbol,
        network: import.meta.env.VITE_NETWORK_NAME,
        nftName: obj.nftName,
      };

      if (kind === "fungible") {
        token.decimals = obj.decimals;
        token.value = obj.amount;
        token.UIAmount =
          obj?.amount &&
          separateDigits(addDecimal(obj?.amount || "0", obj.decimals || 0));
      } else {
        token.nftData = obj.nftData;
        token.nftUri = obj.nftUri;
        token.nftDataUpdatePredicate = obj.nftDataUpdatePredicate;
      }

      return token;
    })
  );

  const filteredTokens = await updatedArray?.filter(
    (token: any) => token.typeId === activeAsset
  );

  return activeAsset ? filteredTokens : updatedArray;
};

export const getProof = async (
  txHash: string,
  isTokens?: boolean
): Promise<TransactionRecordWithProof<TransactionPayload<ITransactionPayloadAttributes>> | null> => {
  try {
    const decodedHash = Base16Converter.decode(txHash);
    const client = isTokens ? tokenClient : tokenClient;
    return client.getTransactionProof(decodedHash)
  } catch(error) {
    console.log('Error fetching transaction proof:', error)
    return null
  }
};

export const getRoundNumber = async (isAlpha: boolean): Promise<bigint | null> => {
  try {
    const client = isAlpha ? moneyClient : tokenClient;
    return client.getRoundNumber();
  } catch(error) {
    console.log('Error fetching round number:', error);
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

export const getImageUrl = async (
  url?: string
): Promise<{ error: string | null; imageUrl: string | null }> => {
  if (!url) {
    return { error: "Missing image URL", imageUrl: null };
  }

  const source = axios.CancelToken.source();
  const timeout = setTimeout(() => {
    source.cancel("Timeout reached");
  }, 3000);

  try {
    const response = await axios.head(url, {
      timeout: 3000,
      cancelToken: source.token,
    });

    if (response.status === 200) {
      const contentLength = response.headers["content-length"];
      if (contentLength && Number(contentLength) > MaxImageSize) {
        return { error: "Image size exceeds 5MB limit", imageUrl: null };
      }

      const contentType = response.headers["content-type"];
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
  error?: string;
} | null> => {
  if (!url) {
    return null;
  }

  const source = axios.CancelToken.source();
  const timeout = setTimeout(() => {
    source.cancel("Timeout reached");
  }, 3000);

  try {
    const response = await axios.head(url, {
      timeout: 3000,
      cancelToken: source.token,
    });

    if (response.status === 200) {
      const contentType = response.headers["content-type"];
      const contentLength = response.headers["content-length"];

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
    if (isCancel(error)) {
      console.error("Request cancelled:", error.message);
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

  const moneyDataPromise = axios
    .get<any>(
      `${MONEY_BACKEND_URL}/fee-credit-bills/${
        id + moneyFeeCreditRecordUnitType
      }`
    )
    .catch();

  const tokensDataPromise = axios
    .get<any>(
      `${TOKENS_BACKEND_URL}/fee-credit-bills/${
        id + tokenFeeCreditRecordUnitType
      }`
    )
    .catch();

  let moneyData = null;
  let tokensData = null;

  try {
    const moneyResponse = await moneyDataPromise;
    moneyData = moneyResponse?.data ?? null;
  } catch (_e) {
    moneyData = null;
  }

  try {
    const tokensResponse = await tokensDataPromise;
    tokensData = tokensResponse?.data ?? null;
  } catch (_e) {
    tokensData = null;
  }

  const data: IFeeCreditBills = {
    [AlphaType]: moneyData,
    [TokenType]: tokensData,
  };

  return data;
};

export const downloadFile = async (url: string, filename: string) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "blob",
  });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
};
