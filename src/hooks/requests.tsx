import axios from "axios";
import { off } from "node:process";

import {
  IBillsList,
  IBlockStats,
  ITransfer,
  IProofsProps,
  ISwapTransferProps,
  IBill,
} from "../types/Types";

export const API_URL = "https://wallet-backend.testnet.alphabill.org/api/v1";

export const getBalance = async (id: string): Promise<any> => {
  if (!id || Number(id) === 0 || !Boolean(id.match(/^0x[0-9A-Fa-f]{66}$/))) {
    return;
  }

  const response = await axios.get<{ balance: number; id: string }>(
    `${API_URL}/balance?pubkey=${id}`
  );

  let res = response.data;
  res = { ...response.data, id: id };

  return res;
};

export const getBillsList = async (id: string): Promise<any> => {
  if (!id || Number(id) === 0 || !Boolean(id.match(/^0x[0-9A-Fa-f]{66}$/))) {
    return;
  }

  const limit = 1;
  let billsList: IBill[] = [];
  let offset = 0;
  let totalBills = null;

  while (totalBills === null || billsList.length < totalBills) {
    const response = await axios.get<IBillsList>(
      `${API_URL}/list-bills?pubkey=${id}&limit=${limit}&offset=${offset}`
    );

    const { bills, total } = response.data;
    totalBills = total;
    billsList = billsList.concat(bills);

    offset += limit;
  }

  return billsList;
};

export const getProof = async (id: string, key: string): Promise<any> => {
  if (
    !id ||
    Number(id) === 0 ||
    !Boolean(id.match(/^0x[0-9A-Fa-f]{66}$/)) ||
    !Boolean(key.match(/^0x[0-9A-Fa-f]{66}$/))
  ) {
    return;
  }

  const response = await axios.get<IProofsProps>(
    `${API_URL}/proof/${key}?bill_id=${id}`
  );

  return response.data;
};

export const getBlockHeight = async (): Promise<IBlockStats> => {
  const response = await axios.get<IBlockStats>(`${API_URL}/block-height`);

  return response.data;
};

export const makeTransaction = async (
  data: ITransfer
): Promise<{ data: ITransfer }> => {
  const response = await axios.post<{ data: ITransfer | ISwapTransferProps }>(
    "https://money-partition.testnet.alphabill.org/api/v1/transactions",
    {
      ...data,
    }
  );

  return response.data;
};
