import axios, { AxiosResponse } from "axios";

import {
  IBillsList,
  IBlockStats,
  ITransfer,
  IProofsProps,
  ISwapTransferProps,
  IBill,
  IFungibleAsset,
  IListTokensResponse,
  ITypeHierarchy,
  IRoundNumber,
  INFTTransferPayload,
  IBalance,
} from "../types/Types";
import {
  AlphaDecimalFactor,
  AlphaDecimalPlaces,
  AlphaType,
} from "../utils/constants";
import {
  addDecimal,
  base64ToHexPrefixed,
  separateDigits,
} from "../utils/utils";

export const MONEY_NODE_URL = import.meta.env.VITE_MONEY_NODE_URL;
export const MONEY_BACKEND_URL = import.meta.env.VITE_MONEY_BACKEND_URL;
export const TOKENS_BACKEND_URL = import.meta.env.VITE_TOKENS_BACKEND_URL;

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
  pubKey: string
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
  let offset = 0;
  let totalBills = null;

  while (totalBills === null || Number(billsList?.length) < totalBills) {
    const response = await axios.get<IBillsList>(
      `${MONEY_BACKEND_URL}/list-bills?pubkey=${pubKey}&limit=${limit}&offset=${offset}`
    );

    const { bills, total } = response.data;
    const billsWithType = bills.map((bill) =>
      Object.assign(bill, {
        typeId: AlphaType,
        name: AlphaType,
        network: import.meta.env.VITE_NETWORK_NAME,
        decimalFactor: AlphaDecimalFactor,
        decimalPlaces: AlphaDecimalPlaces,
        UIAmount: separateDigits(
          addDecimal(bill.value || "0", AlphaDecimalPlaces)
        ),
        isSendable: true,
      })
    );

    totalBills = total;
    billsList = billsList.concat(billsWithType);
    offset += limit;
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
        (nextOffsetKey ? nextOffsetKey : `/kinds/${kind}/types?limit=${limit}`)
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
    `${TOKENS_BACKEND_URL}/types/${base64ToHexPrefixed(typeId)}/hierarchy`
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
          ? nextOffsetKey
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
      };

      if (kind === "fungible") {
        token.decimals = obj.decimals;
        token.value = obj.amount;
      } else {
        token.nftData = obj.nftData;
        token.nftUri = obj.nftUri;
        token.nftDataUpdatePredicate = obj.nftDataUpdatePredicate;
        token.isImageUrl = false; // add the initial field value
        const imageUrl = await fetchImage(obj?.nftUri);
        if (imageUrl) {
          token.isImageUrl = true;
        }
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
  billID: string
): Promise<IProofsProps | undefined> => {
  if (!Boolean(billID.match(/^0x[0-9A-Fa-f]{64}$/))) {
    return;
  }

  const response = await axios.get<IProofsProps>(
    `${MONEY_BACKEND_URL}/proof?bill_id=${billID}`
  );

  return response.data;
};

export const getBlockHeight = async (isAlpha: boolean): Promise<bigint> => {
  const response = await axios.get<IBlockStats | IRoundNumber>(
    isAlpha
      ? `${MONEY_BACKEND_URL}/block-height`
      : `${TOKENS_BACKEND_URL}/round-number`
  );

  if (isAlpha) {
    return BigInt((response.data as IBlockStats).blockHeight);
  } else {
    return BigInt((response.data as IRoundNumber).roundNumber);
  }
};

export const makeTransaction = async (
  data: ITransfer | INFTTransferPayload,
  pubKey?: string
): Promise<{ data: ITransfer }> => {
  const url = pubKey ? TOKENS_BACKEND_URL : MONEY_NODE_URL;
  const response = await axios.post<{ data: ITransfer | ISwapTransferProps }>(
    `${url}/transactions${pubKey ? "/" + pubKey : ""}`,
    {
      ...data,
    }
  );

  return response.data;
};

export const fetchImage = async (url?: string) => {
  if (!url) return false;
  try {
    const response = await axios.head(url, { timeout: 3000 });
    if (response.status === 200) {
      const contentType = response.headers["content-type"];
      if (contentType && contentType.startsWith("image/")) {
        return url;
      }
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};
