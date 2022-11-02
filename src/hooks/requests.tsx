import axios from 'axios';

export const getBalance = async (id: string): Promise<any> => {
  if (!id || Number(id) === 0 || !id.startsWith('0x0')) {
    return
  }

  const response = await axios.get<any>(`https://dev-ab-wallet-backend.abdev1.guardtime.com/balance?pubkey=${id}`);

  return response.data;
};