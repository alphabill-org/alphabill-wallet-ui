import axios from "axios";

import {
  IBillsList,
  IBlockStats,
  ITransfer,
  IProofsProps,
  ISwapTransferProps,
  IBill,
} from "../types/Types";

export const API_URL = import.meta.env.VITE_MONEY_BACKEND_URL;

export const getBalance = async (pubKey: string): Promise<any> => {
  if (
    !pubKey ||
    Number(pubKey) === 0 ||
    !Boolean(pubKey.match(/^0x[0-9A-Fa-f]{66}$/))
  ) {
    return;
  }

  const response = await axios.get<{ balance: number; pubKey: string }>(
    `${API_URL}/balance?pubkey=${pubKey}`
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
      `${API_URL}/list-bills?pubkey=${pubKey}&limit=${limit}&offset=${offset}`
    );

    const { bills, total } = response.data;
    totalBills = total;
    billsList = billsList.concat(bills);

    offset += limit;
  }

  return billsList;
};

export const getProof = async (billID: string): Promise<any> => {
  if (!Boolean(billID.match(/^0x[0-9A-Fa-f]{64}$/))) {
    return;
  }

  const response = await axios.get<IProofsProps>(
    `${API_URL}/proof?bill_id=${billID}`
  );

  return response.data;
};

export const getBlockHeight = async (): Promise<bigint> => {
  const response = await axios.get<IBlockStats>(`${API_URL}/block-height`);

  return BigInt(response.data.blockHeight);
};

export const makeTransaction = async (
  data: ITransfer
): Promise<{ data: ITransfer }> => {
  const response = await axios.post<{ data: ITransfer | ISwapTransferProps }>(
    import.meta.env.VITE_MONEY_NODE_URL + "/transactions",
    {
      ...data,
    }
  );

  return response.data;
};
