import { useCallback, useEffect } from "react";
import { getIn } from "formik";
import CryptoJS from "crypto-js";
import { HDKey } from "@scure/bip32";
import { entropyToMnemonic, mnemonicToSeedSync } from "bip39";
import { isNumber, sortBy } from "lodash";
import { QueryClient } from "react-query";

import { IAccount, IBill, IListTokensResponse } from "../types/Types";
import { AlphaDecimals, AlphaType, DCTransfersLimit, localStorageKeys } from "./constants";

export const extractFormikError = (
  errors: unknown,
  touched: unknown,
  names: string[]
): string =>
  names
    .map((name) => {
      const error = getIn(errors, name);
      const touch = getIn(touched, name);

      if (!error || !touch || typeof error !== "string") {
        return "";
      }

      return !!(error && touch) ? error : "";
    })
    .find((error) => !!error) || "";

export const unit8ToHexPrefixed = (key: Uint8Array) =>
  "0x" + Buffer.from(key).toString("hex");

export const base64ToHexPrefixed = (key: string = "") => {
  const isHex = /^(0x)?[0-9A-Fa-f]+$/i.test(key);

  if (isHex) {
    return key;
  } else {
    return "0x" + Buffer.from(key, "base64").toString("hex");
  }
};

export const checkPassword = (password: string | undefined) => {
  if (!password) {
    return false;
  }
  return Number(password?.length) >= 8;
};

export const getKeys = (
  password: string,
  accountIndex: number,
  vault: string | null
) => {
  if (!vault)
    return {
      hashingPublicKey: null,
      hashingPrivateKey: null,
      error: null,
      decryptedVault: null,
      masterKey: null,
    };

  const decryptedVault = CryptoJS.AES.decrypt(
    vault.toString(),
    password
  ).toString(CryptoJS.enc.Latin1);

  try {
    JSON.parse(decryptedVault);
  } catch {
    return {
      hashingPublicKey: null,
      hashingPrivateKey: null,
      error: "Password is incorrect!",
      decryptedVault: null,
      masterKey: null,
    };
  }

  const decryptedVaultJSON = JSON.parse(decryptedVault);

  if (
    decryptedVaultJSON?.entropy?.length > 16 &&
    decryptedVaultJSON?.entropy?.length < 32 &&
    decryptedVaultJSON?.entropy?.length % 4 === 0
  ) {
    return {
      hashingPublicKey: null,
      hashingPrivateKey: null,
      error: "Password is incorrect!",
      decryptedVault: null,
      masterKey: null,
    };
  }

  const mnemonic = entropyToMnemonic(decryptedVaultJSON?.entropy);
  const seed = mnemonicToSeedSync(mnemonic);
  const masterKey = HDKey.fromMasterSeed(seed);
  const hashingKey = masterKey.derive(`m/44'/634'/${accountIndex}'/0/0`);
  const hashingPrivateKey = hashingKey.privateKey;
  const hashingPublicKey = hashingKey.publicKey;

  return {
    hashingPublicKey: hashingPublicKey,
    hashingPrivateKey: hashingPrivateKey,
    decryptedVault: decryptedVaultJSON,
    error: null,
    masterKey: masterKey,
    hashingKey: hashingKey,
  };
};

export const isTokenSendable = () => {
  return true; // TODO: Figure out new requirements
};

export const findClosestBigger = (
  bills: IBill[],
  target: string
): IBill | undefined => {
  return bills
    .sort((a: IBill, b: IBill) => {
      if (BigInt(a.value) > BigInt(b.value)) {
        return 1;
      } else if (BigInt(a.value) < BigInt(b.value)) {
        return -1;
      } else {
        return 0;
      }
    })
    .find(({ value }) => BigInt(value) >= BigInt(target));
};

export const getClosestSmaller = (bills: IBill[], target: string) => {
  if (Number(bills?.length) === 0) {
    return null;
  }

  return bills?.reduce((acc: IBill, obj: IBill) => {
    const value = BigInt(obj.value);
    const accValue = BigInt(acc.value);
    const targetInt = BigInt(target);
    const absDiff = value > targetInt ? value - targetInt : targetInt - value;
    const currentAbsDiff =
      accValue > targetInt ? accValue - targetInt : targetInt - accValue;
    return absDiff < currentAbsDiff ? obj : acc;
  });
};

export const getOptimalBills = (
  amount: string,
  billsArr: IBill[],
  feeAmount: bigint = 0n
): IBill[] => {
  if (!billsArr) {
    return [];
  }
  const selectedBills: IBill[] = [];
  const amountBigInt = BigInt(amount) + feeAmount;
  const zeroBigInt = 0n;

  const closestBigger = findClosestBigger(billsArr, amount + feeAmount);
  if (closestBigger && BigInt(closestBigger.value) > zeroBigInt) {
    selectedBills.push(closestBigger);
  } else {
    const initialBill = getClosestSmaller(billsArr, amount + feeAmount);
    if (initialBill === null) {
      return [];
    } else {
      selectedBills.push(initialBill);
      let missingSum = amountBigInt - BigInt(initialBill.value);

      while (missingSum > zeroBigInt) {
        const filteredBills = billsArr?.filter(
          (bill) => !selectedBills.includes(bill)
        );
        const filteredBillsSum = getBillsSum(filteredBills);

        let addedSum;
        const closestBigger = findClosestBigger(
          filteredBills,
          (feeAmount ? missingSum + feeAmount : missingSum).toString()
        );
        if (closestBigger && BigInt(closestBigger.value) > zeroBigInt) {
          selectedBills.push(closestBigger);
          addedSum = BigInt(closestBigger.value);
        } else {
          const currentBill = getClosestSmaller(
            filteredBills,
            (feeAmount ? missingSum + feeAmount : missingSum).toString()
          );
          if (currentBill === null) {
            return [];
          } else {
            selectedBills.push(currentBill);
            addedSum = BigInt(currentBill.value);
          }
        }
        missingSum = missingSum - addedSum;
        if (filteredBillsSum <= zeroBigInt) {
          break;
        }
      }
    }
  }

  return selectedBills;
};

export function handleBillSelection(
  convertedAmount: string,
  billsArr: IBill[],
  feeAmount?: bigint
): {
  optimalBills: IBill[];
  billsToTransfer: IBill[];
  billToSplit: IBill | null | undefined;
  splitBillAmount: bigint | null;
} {
  const optimalBills = getOptimalBills(convertedAmount, billsArr, feeAmount);

  const billsSumDifference =
    getBillsSum(optimalBills) -
    BigInt(convertedAmount) -
    (optimalBills.length < 1 || !feeAmount
      ? 0n
      : BigInt(optimalBills.length) * feeAmount);

  const billToSplit =
    billsSumDifference !== 0n
      ? findClosestBigger(optimalBills, billsSumDifference.toString())
      : null;

  const billsToTransfer = billToSplit
    ? optimalBills?.filter((bill) => bill.id !== billToSplit?.id)
    : optimalBills;

  const splitBillAmount = billToSplit
    ? BigInt(billToSplit.value) - billsSumDifference
    : null;

  return { optimalBills, billsToTransfer, billToSplit, splitBillAmount };
}

export const getBillsSum = (bills: IBill[]) =>
  bills?.reduce((acc, obj: IBill) => {
    return acc + BigInt(obj.value);
  }, 0n);

export const useDocumentClick = (
  callback: (event: MouseEvent) => void,
  ref: React.MutableRefObject<HTMLElement | null>
) => {
  const isScrollbar = (element: any) => {
    // Check if the element has a scrollbar by comparing its scrollHeight with clientHeight
    return (
      element.scrollHeight > element.clientHeight ||
      element.scrollWidth > element.clientWidth
    );
  };

  const handler = useCallback(
    (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !isScrollbar(event.target)
      ) {
        callback(event);
      }
    },
    [callback, ref]
  );

  useEffect(() => {
    window.addEventListener("mousedown", handler);

    return () => {
      window.removeEventListener("mousedown", handler);
    };
  }, [handler]);
};

export const addDecimal = (str: string, pos: number) => {
  if (pos <= 0 || !str) {
    return str;
  }
  const convertedAmount = str.padStart(pos + 1, "0");
  return `${convertedAmount.slice(0, -pos)}.${convertedAmount.slice(-pos)}`;
};

export const countDecimalLength = (str: string) => {
  const decimalIndex = str.indexOf(".");
  if (decimalIndex === -1) {
    return 0;
  } else {
    return Number(str?.length) - decimalIndex - 1;
  }
};

export const convertToWholeNumberBigInt = (
  val: string | number,
  decimals: number
): bigint => {
  let numStr = isNumber(val) ? val.toString() : val;
  const num = parseFloat(numStr);

  if (isNaN(num) || num < 0) {
    throw new Error("Converting to whole number failed: Input is not valid");
  }

  const numStrWithoutDecimal = numStr.replace(".", "");
  const decimalDifference = decimals - countDecimalLength(numStr);
  const fullNumber =
    decimalDifference > 0
      ? numStrWithoutDecimal + "0".repeat(decimalDifference)
      : numStrWithoutDecimal;

  return BigInt(fullNumber);
};

export const separateDigits = (numStr: string) => {
  const num = parseFloat(numStr);

  if (isNaN(num) || num < 0) {
    throw new Error("Separating digits failed: Input is not valid");
  }

  const [integerPart, decimalPart = ""] = numStr.split(".");
  const formattedIntegerPart = integerPart.replace(/(\d)(?=(\d{3})+$)/g, "$1'");

  if (Number(decimalPart?.length) > 0) {
    const formattedDecimalPart = decimalPart
      .replace(/0+$/, "")
      .replace(/(\d{3})(?=\d)/g, "$1'");
    return `${formattedIntegerPart}${
      formattedDecimalPart && "." + formattedDecimalPart
    }`;
  }

  return formattedIntegerPart;
};

export const invalidateAllLists = async (
  pubKey: string,
  assetTypeId: string,
  queryClient: QueryClient
) => {
  queryClient.invalidateQueries(["fungibleTokenList", pubKey, assetTypeId]);
  queryClient.invalidateQueries(["fungibleTokensList", pubKey]);
  queryClient.invalidateQueries(["NFTList", pubKey, assetTypeId]);
  queryClient.invalidateQueries(["NFTsList", pubKey]);
  queryClient.invalidateQueries(["tokenTypesList", pubKey]);
  queryClient.invalidateQueries(["billsList", pubKey]);
  queryClient.invalidateQueries(["balance", pubKey]);
  queryClient.invalidateQueries(["feeBillsList", pubKey]);
};

export const getTokensLabel = (typeId: string) =>
  typeId === AlphaType ? "bill" : "token";

export const getUpdatedNFTAssets = (NFTsList: IListTokensResponse[] | undefined = []) => {
  return (
    NFTsList?.map((nft) => {
      return Object.assign(nft, {
        isSendable: isTokenSendable(),
        iconImage: nft.icon,
        amountOfSameType:
          NFTsList?.filter(
            (obj: IListTokensResponse) => obj.typeId === nft.typeId
          )?.length || "0",
      });
    }) || []
  );
};

const getUpdatesUTPFungibleTokens = (fungibleTokensList: IListTokensResponse[] | undefined = []) => {
  let userTokens: any = [];
  let typeIDs: string[] = [];

  // This is needed to calculate the sum of tokens with same type & combine them
  if (fungibleTokensList.length >= 1) {
    for (let token of fungibleTokensList) {
      if (!typeIDs.includes(token.typeId)) {
        typeIDs.push(token.typeId);
        userTokens.push({
          id: token.id,
          typeId: token.typeId,
          owner: token.owner,
          amount: token.value,
          kind: token.kind,
          decimals: token?.decimals || 0,
          txHash: token.txHash,
          symbol: token.symbol,
          network: token.network,
          icon: token.icon,
          invariantPredicate: token.invariantPredicate
        });
      } else {
        for (let resultToken of userTokens) {
          if (resultToken.typeId === token.typeId && token?.value) {
            resultToken.amount = (
              BigInt(resultToken.amount) + BigInt(token.value!)
            ).toString();
          }
        }
      }
    }
  }

  return (
    userTokens?.map((obj: IListTokensResponse) => ({
      id: obj.id,
      typeId: obj.typeId,
      symbol: obj.symbol,
      network: obj.network,
      amount: obj.amount?.toString(),
      decimals: obj.decimals,
      isSendable: isTokenSendable(),
      iconImage: obj.icon,
      UIAmount: separateDigits(
        addDecimal(obj.amount || "0", obj.decimals || 0)
      ),
    })) || []
  );
};

export const getUpdatedFungibleAssets = (
  fungibleTokensList: IListTokensResponse[] | undefined = [],
  activeAccountId: string,
  balances: any[]
) => {
  const fungibleUTPAssets = getUpdatesUTPFungibleTokens(fungibleTokensList);
  const ALPHABalance =
    String(balances?.find((balance: any) => balance?.data?.pubKey === activeAccountId)
      ?.data?.balance || "0");

  const alphaAsset = {
    id: AlphaType,
    symbol: AlphaType,
    network: import.meta.env.VITE_NETWORK_NAME,
    amount: ALPHABalance,
    decimals: AlphaDecimals,
    UIAmount: separateDigits(addDecimal(ALPHABalance || "0", AlphaDecimals)),
    typeId: AlphaType,
    isSendable: true,
  };

  return sortBy(fungibleUTPAssets.concat([alphaAsset]), ["id"]);
};

const sortByTypeId = (arr: any) =>
  arr?.sort((a: any, b: any) =>
    a.typeId < b.typeId ? -1 : a.typeId > b.typeId ? 1 : 0
  );

const filterUniqueTypes = (arr: any) =>
  arr?.filter(
    ({ typeId }: any, index: any, array: any) =>
      index === 0 || typeId !== array[index - 1].typeId
  );

const sortBySymbol = (arr: any) =>
  arr?.sort((a: any, b: any) =>
    a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0
  );

export { sortByTypeId, filterUniqueTypes, sortBySymbol };

export const downloadHexFile = (hexString: string, filename: string) => {
  const blob = new Blob([hexString], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.setAttribute("download", `${filename}.txt`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  window.URL.revokeObjectURL(url);
};

export const removeConnectTransferData = () =>
  chrome?.storage?.local.remove("ab_connect_transfer");

export const FeeCostEl = () => (
  <span className="t-small pad-8-t m-auto w-100p flex flex-justify-c op-06">
    Transaction fee per transaction 0.000'000'01 ALPHA
  </span>
);

export const getFungibleAssetsAmount = (
  account: IAccount,
  decimals: number,
  assetTypeId: string
) =>
  addDecimal(
    BigInt(
      account?.assets?.fungible?.find((asset) => asset.typeId === assetTypeId)
        ?.amount || "0"
    ).toString() || "0",
    Number(decimals)
  );

export const Base64imageComponent: React.FC<{
  base64Data: { data: string; type: string };
  alt: string;
}> = ({ base64Data, alt }) => {
  const imageUrl = isImage(base64Data.data, base64Data.type)
    ? base64Data.data
    : null;

  return imageUrl ? (
    <img src={`data:${base64Data.type};base64,${imageUrl}`} alt={alt} />
  ) : null;
};

export const isImage = (data: string, type: string): boolean => {
  const isSVG = type?.startsWith("image/svg");

  if (isSVG) {
    return true;
  } else {
    const img = new Image();
    img.src = `data:image;base64,${data}`;
    return img.complete && img.naturalWidth !== 0;
  }
};

export const isValidAddress = (value?: string) =>
  Boolean(value?.match(/^0x[0-9A-Fa-f]{66}$/));

export const clearStorage = () =>
  localStorageKeys.map((key) => localStorage.removeItem(key));

export const createEllipsisString = (
  id: string,
  firstCount: number,
  lastCount: number
): string => {
  if (firstCount + lastCount >= Number(id?.length)) {
    return id;
  }

  return id?.substr(0, firstCount) + "..." + id?.substr(id.length - lastCount);
};

// Will be updated with lock transactions in v0.5.0
export const isBillLocked = (
  consolidationTargetUnit: IBill,
  asset: IBill,
  DCBills: IBill[]
) => {
  return (
    (consolidationTargetUnit?.id === asset.id &&
      DCBills?.length >= 1 &&
      Boolean(
        DCBills?.find(
          (cb: IBill) => cb.targetUnitId === consolidationTargetUnit?.id
        )
      )) ||
    (DCBills?.length >= 1 &&
      consolidationTargetUnit &&
      Boolean(DCBills?.find((cb: IBill) => cb.targetUnitId === asset.id)))
  );
};

// Will be updated with lock transactions in v0.5.0
export const unlockedBills = (bills: IBill[]) => {
  const DCBills = bills?.filter((b: IBill) => Boolean(b.targetUnitId));
  const collectableBills =
    bills?.filter((b: IBill) => !Boolean(b.targetUnitId)) || [];
  const targetIds = DCBills?.map((item) => item.targetUnitId);
  return collectableBills?.filter((item) => !targetIds.includes(item.id));
};

// Will be updated with lock transactions in v0.5.0
export const getBillsAndTargetUnitToConsolidate = (
  billsList: IBill[] | undefined
): {
  billsToConsolidate: IBill[];
  consolidationTargetUnit: IBill | undefined;
} => {
  const collectableBills =
    billsList?.filter((b: IBill) => !Boolean(b.targetUnitId)) || [];
  const DCBills =
    billsList?.filter((b: IBill) => Boolean(b.targetUnitId)) || [];

  const targetIds = DCBills?.map((item) => item.targetUnitId);
  const consolidationTargetUnit =
    collectableBills?.find((bill: IBill) => targetIds?.includes(bill.id)) ||
    findBillWithLargestValue(collectableBills)!;

  const billsToConsolidate = collectableBills
    ?.filter((b: IBill) => b.id !== consolidationTargetUnit?.id)
    .slice(0, DCTransfersLimit);

  return {
    billsToConsolidate: billsToConsolidate || [],
    consolidationTargetUnit,
  };
};

export const findBillWithLargestValue = (bills: IBill[]) => {
  if (bills.length === 0) {
    return null; // Return null if the array is empty
  }

  let largestValueBill = bills[0]; // Initialize with the first object
  let largestValue = BigInt(largestValueBill?.value || ""); // Convert to BigInt

  for (const obj of bills) {
    const objValue = BigInt(obj?.value || ""); // Convert to BigInt
    if (objValue > largestValue) {
      largestValueBill = obj; // Update the largest object
      largestValue = objValue; // Update the largest value
    }
  }

  return largestValueBill;
};
