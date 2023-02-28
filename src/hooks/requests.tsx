import axios from "axios";

import {
  IBillsList,
  IBlockStats,
  ITransfer,
  IProofsProps,
  ISwapTransferProps,
  IBill,
  IFungibleAsset,
  IFungibleResponse,
  ITypeHierarchy,
} from "../types/Types";

export const API_URL = "https://wallet-backend.testnet.alphabill.org";
export const API_TOKENS_URL =
  "https://dev-ab-tokens-backend.abdev1.guardtime.com";
export const API_PARTITION_URL =
  "https://money-partition.testnet.alphabill.org";

export const getBalance = async (pubKey: string): Promise<any> => {
  if (
    !pubKey ||
    Number(pubKey) === 0 ||
    !Boolean(pubKey.match(/^0x[0-9A-Fa-f]{66}$/))
  ) {
    return;
  }

  const response = await axios.get<{ balance: number; pubKey: string }>(
    `${API_URL}/api/v1/balance?pubkey=${pubKey}`
  );

  let res = response.data;
  res = { ...response.data, pubKey: pubKey };

  return res;
};

export const getBillsList = async (pubKey: string): Promise<any> => {
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

  while (totalBills === null || billsList.length < totalBills) {
    const response = await axios.get<IBillsList>(
      `${API_URL}/api/v1/list-bills?pubkey=${pubKey}&limit=${limit}&offset=${offset}`
    );

    const { bills, total } = response.data;
    totalBills = total;
    billsList = billsList.concat(bills);

    offset += limit;
  }

  return billsList;
};

export const fetchAllTypes = async (
  kind: string = "fungible",
  limit: number = 100,
  offsetKey: string = ""
) => {
  const types = [];
  let nextOffsetKey: string | null = offsetKey;

  while (nextOffsetKey !== null) {
    const response: any = await axios.get(
      API_TOKENS_URL +
        (nextOffsetKey
          ? nextOffsetKey
          : `/api/v1/kinds/${kind}/types?limit=${limit}`)
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
    `${API_URL}/api/v1/types/${typeId}/hierarchy`
  );

  return response.data;
};

export const getUserTokens = async (
  owner: string,
  activeAsset?: string,
  kind: string = "fungible",
  limit = 1,
  offsetKey = ""
) => {
  const tokens: any = [];
  let nextOffsetKey: string | null = offsetKey;

  while (nextOffsetKey !== null) {
    const response: any = await axios.get(
      API_TOKENS_URL +
        (nextOffsetKey
          ? nextOffsetKey
          : `/api/v1/kinds/${kind}/owners/${owner}/tokens?limit=${limit}`)
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

  const updatedArray = tokens?.map((obj: IFungibleResponse) => {
    return {
      id: obj.id,
      typeId: obj.typeId,
      owner: obj.owner,
      value: obj.amount,
      decimals: obj.decimals,
      kind: obj.kind,
      txHash: obj.txHash,
      symbol: obj.symbol,
    };
  });

  const filteredTokens = updatedArray.filter(
    (token: IFungibleAsset) => token.typeId === activeAsset
  );

  return activeAsset ? filteredTokens : tokens;
};

export const getProof = async (billID: string): Promise<any> => {
  if (!Boolean(billID.match(/^0x[0-9A-Fa-f]{64}$/))) {
    return;
  }

  const response = await axios.get<IProofsProps>(
    `${API_URL}/api/v1/proof?bill_id=${billID}`
  );

  return response.data;
};

export const getBlockHeight = async (): Promise<IBlockStats> => {
  const response = await axios.get<IBlockStats>(
    `${API_URL}/api/v1/block-height`
  );

  return response.data;
};

export const makeTransaction = async (
  data: ITransfer,
  pubKey?: string
): Promise<{ data: ITransfer }> => {
  const url = pubKey ? API_TOKENS_URL : API_PARTITION_URL;
  const response = await axios.post<{ data: ITransfer | ISwapTransferProps }>(
    `${url}/api/v1/transactions/${pubKey}`,
    {
      ...data,
    }
  );

  return response.data;
};
