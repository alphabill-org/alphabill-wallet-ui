import axios, { AxiosError, AxiosResponse, isCancel } from "axios";
import { encodeAsync, decode } from "cbor";

import {
  ITransactionPayload,
  IBill,
  IListTokensResponse,
  ITypeHierarchy,
  IRoundNumber,
  IBalance,
  IFeeCreditBills,
  ITxProof,
} from "../types/Types";
import {
  AlphaDecimals,
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

export const MONEY_NODE_URL = import.meta.env.VITE_MONEY_NODE_URL;
export const MONEY_BACKEND_URL = import.meta.env.VITE_MONEY_BACKEND_URL;
export const TOKENS_BACKEND_URL = import.meta.env.VITE_TOKENS_BACKEND_URL;

const handleError = (error: AxiosError) => {
  if (error.response?.status === 404) {
    // If the status code is 404, return null to prevent the error from propagating
    return null;
  }
  // For other errors, you can choose to handle them differently or re-throw them
  throw error;
};

export const getBalance = async (
  pubKey: string
): Promise<IBalance | undefined> => {
  if (
    !pubKey ||
    Number(pubKey) === 0 ||
    !Boolean(pubKey.match(/^0x[0-9A-Fa-f]{66}$/))
  ) {
    return;
  }

  const response = await axios.get<{ balance: number; pubKey: string }>(
    `${MONEY_BACKEND_URL}/balance?pubkey=${pubKey}`
  );

  let res = response.data;
  res = { ...response.data, pubKey: pubKey };

  return res;
};

export const getBillsList = async (
  pubKey: string,
  offsetKey: string = ""
): Promise<IBill[] | undefined> => {
  if (
    !pubKey ||
    Number(pubKey) === 0 ||
    !Boolean(pubKey.match(/^0x[0-9A-Fa-f]{66}$/))
  ) {
    return;
  }

  const limit = 100;
  let billsList: IBill[] = [];
  let nextOffsetKey: string | null = offsetKey;

  while (nextOffsetKey !== null) {
    const response: AxiosResponse = await axios.get(
      MONEY_BACKEND_URL +
        (nextOffsetKey
          ? nextOffsetKey.replace("/api/v1", "") // MONEY_BACKEND_URL includes /api/v1
          : `/list-bills?pubkey=${pubKey}&limit=${limit}`)
    );

    const { bills } = response.data;
    const billsWithType =
      bills?.map((bill: IBill) =>
        Object.assign(bill, {
          typeId: AlphaType,
          name: AlphaType,
          network: import.meta.env.VITE_NETWORK_NAME,
          decimals: AlphaDecimals,
          UIAmount:
            bill?.value &&
            separateDigits(addDecimal(bill?.value || "0", AlphaDecimals)),
          isSendable: true,
        })
      ) || [];

    billsList = billsList.concat(billsWithType);

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

  return billsList;
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
  billID: string,
  txHash: string,
  isTokens?: boolean
): Promise<ITxProof | undefined> => {
  if (!billID) {
    return;
  }

  const url = isTokens ? TOKENS_BACKEND_URL : MONEY_BACKEND_URL;
  const response = await axios
    .get<any>(`${url}/units/${billID}/transactions/${txHash}/proof`, {
      responseType: "arraybuffer",
    })
    .catch(handleError);

  const decoded = response?.data && decode(Buffer.from(response?.data));

  const proofObj = {
    txRecord: decoded?.[0],
    txProof: decoded?.[1],
  };

  return proofObj;
};

export const getRoundNumber = async (isAlpha: boolean): Promise<bigint> => {
  const backendUrl = isAlpha ? MONEY_BACKEND_URL : TOKENS_BACKEND_URL;
  const response = await axios.get<IRoundNumber>(backendUrl + "/round-number");

  return BigInt((response.data as IRoundNumber).roundNumber);
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
    .catch(handleError);

  const tokensDataPromise = axios
    .get<any>(
      `${TOKENS_BACKEND_URL}/fee-credit-bills/${
        id + tokenFeeCreditRecordUnitType
      }`
    )
    .catch(handleError);

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
