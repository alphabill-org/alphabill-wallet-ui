import axios from "axios";
import { IBillsList, IBlockStats, ITransfer } from "../types/Types";

export const getBalance = async (id: string): Promise<any> => {
  if (!id || Number(id) === 0 || !id.startsWith("0x0")) {
    return;
  }

  const response = await axios.get<{ balance: number; id: string }>(
    `https://dev-ab-wallet-backend.abdev1.guardtime.com/balance?pubkey=${id}`
  );

  let res = response.data;
  res = { ...response.data, id: id };

  return res;
};

export const getBillsList = async (id: string): Promise<IBillsList> => {
  const response = await axios.get<IBillsList>(
    `https://dev-ab-wallet-backend.abdev1.guardtime.com/list-bills?pubkey=${id}`
  );

  return response.data;
};

export const getBlockHeight = async (): Promise<IBlockStats> => {
  const response = await axios.get<IBlockStats>(
    `https://dev-ab-faucet-api.abdev1.guardtime.com/stats/block-height`
  );

  return response.data;
};


export const makeTransaction = async (
  data: ITransfer
): Promise<{ data: ITransfer }> => {
  const response = await axios.post<{ data: ITransfer }>(
    'https://dev-ab-money-partition.abdev1.guardtime.com/api/v1/transactions',
    {
      ...data,
    }
  );

  return response.data;
};