import axios from "axios";
import { IBillsList, IBlockStats, ITransfer } from "../types/Types";

export const API_URL = "https://wallet-backend.testnet.alphabill.org/api/v1"

export const getBalance = async (id: string): Promise<any> => {
  if (!id || Number(id) === 0 || !id.startsWith("0x")) {
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
  if (!id || Number(id) === 0 || !id.startsWith("0x")) {
    return;
  }

  const response = await axios.get<IBillsList>(
    `${API_URL}/list-bills?pubkey=${id}`
  );

  return response.data;
};

export const getBlockHeight = async (): Promise<IBlockStats> => {
  const response = await axios.get<IBlockStats>(
    `https://faucet.testnet.alphabill.org/stats/block-height`
  );

  return response.data;
};

export const makeTransaction = async (
  data: ITransfer
): Promise<{ data: ITransfer }> => {
  const response = await axios.post<{ data: ITransfer }>(
    "https://money-partition.testnet.alphabill.org/api/v1/transactions",
    {
      ...data,
    }
  );

  return response.data;
};
