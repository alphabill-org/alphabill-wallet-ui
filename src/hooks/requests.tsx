import axios from "axios";

import {
  IBillsList,
  IBlockStats,
  ITransfer,
  IProofsProps,
  ISwapTransferProps,
} from "../types/Types";

export const getBalance = async (id: string, url: string): Promise<any> => {
  if (!id || Number(id) === 0 || !Boolean(id.match(/^0x[0-9A-Fa-f]{66}$/))) {
    return;
  }

  const response = await axios.get<{ balance: number; id: string, url: string }>(
    `${url}/balance?pubkey=${id}`
  );

  let res = response.data;
  res = { ...response.data, id: id, url: url };

  return res;
};

export const getBillsList = async (id: string, url: string): Promise<any> => {
  if (!id || Number(id) === 0 || !Boolean(id.match(/^0x[0-9A-Fa-f]{66}$/))) {
    return;
  }

  const response = await axios.get<IBillsList>(
    `${url}/list-bills?pubkey=${id}`
  );

  return response.data;
};

export const getProof = async (
  id: string,
  key: string,
  url: string
): Promise<any> => {
  if (
    !id ||
    Number(id) === 0 ||
    !Boolean(id.match(/^0x[0-9A-Fa-f]{66}$/)) ||
    !Boolean(key.match(/^0x[0-9A-Fa-f]{66}$/))
  ) {
    return;
  }

  const response = await axios.get<IProofsProps>(
    `${url}/proof/${key}?bill_id=${id}`
  );

  return response.data;
};

export const getBlockHeight = async (
  isTesTenet: boolean
): Promise<IBlockStats> => {
  const FAUCET_URL = isTesTenet
    ? "faucet.testnet.alphabill.org"
    : "dev-ab-faucet-api.abdev1.guardtime.com";
  const response = await axios.get<IBlockStats>(
    `https://${FAUCET_URL}/stats/block-height`
  );

  return response.data;
};

export const makeTransaction = async (
  data: ITransfer,
  url: string
): Promise<{ data: ITransfer }> => {
  const response = await axios.post<{ data: ITransfer | ISwapTransferProps }>(
    `${url}/transactions`,
    {
      ...data,
    }
  );

  return response.data;
};
