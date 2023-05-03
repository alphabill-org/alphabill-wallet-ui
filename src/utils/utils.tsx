import { useCallback, useEffect, useRef } from "react";
import { getIn } from "formik";
import CryptoJS from "crypto-js";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";
import { uniq, isNumber, sortBy } from "lodash";
import * as secp from "@noble/secp256k1";
import { QueryClient } from "react-query";

import {
  IAccount,
  IFungibleAsset,
  IBill,
  ITxProof,
  ITypeHierarchy,
  IListTokensResponse,
  ITokensListTypes,
  INFTAsset,
} from "../types/Types";
import {
  AlphaDecimalFactor,
  AlphaDecimals,
  AlphaType,
  opCheckSig,
  opDup,
  opEqual,
  opHash,
  opPushHash,
  opPushPubKey,
  opPushSig,
  opVerify,
  pushBoolTrue,
  sigScheme,
  startByte,
} from "./constants";

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

export function useCombinedRefs(...refs: any[]) {
  const targetRef = useRef();

  useEffect(() => {
    refs.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === "function") {
        ref(targetRef.current);
      } else {
        ref.current = targetRef.current;
      }
    });
  }, [refs]);

  return targetRef;
}

export const hexToBase64 = (key: string) =>
  Buffer.from(key, "hex").toString("base64");

export const unit8ToHexPrefixed = (key: Uint8Array) =>
  "0x" + Buffer.from(key).toString("hex");

export const base64ToHexPrefixed = (key: string = "") =>
  "0x" + Buffer.from(key, "base64").toString("hex");

export const base64ToHex = (key: string = "") =>
  Buffer.from(key, "base64").toString("hex");

export const sortBillsByID = (bills: IBill[]) =>
  uniq(bills).sort((a: IBill, b: IBill) =>
    BigInt(base64ToHexPrefixed(a.id)) < BigInt(base64ToHexPrefixed(b.id))
      ? -1
      : BigInt(base64ToHexPrefixed(a.id)) > BigInt(base64ToHexPrefixed(b.id))
      ? 1
      : 0
  );

export const sortTxProofsByID = (transfers: ITxProof[]) =>
  transfers.sort((a: ITxProof, b: ITxProof) =>
    BigInt(base64ToHexPrefixed(a.tx.unitId)) <
    BigInt(base64ToHexPrefixed(b.tx.unitId))
      ? -1
      : BigInt(base64ToHexPrefixed(a.tx.unitId)) >
        BigInt(base64ToHexPrefixed(b.tx.unitId))
      ? 1
      : 0
  );

export const sortIDBySize = (arr: string[]) =>
  arr.sort((a: string, b: string) =>
    BigInt(base64ToHexPrefixed(a)) < BigInt(base64ToHexPrefixed(b))
      ? -1
      : BigInt(base64ToHexPrefixed(a)) > BigInt(base64ToHexPrefixed(b))
      ? 1
      : 0
  );

export const getNewBearer = (account: IAccount) => {
  const address = account.pubKey.startsWith("0x")
    ? account.pubKey.substring(2)
    : account.pubKey;
  const addressHash = CryptoJS.enc.Hex.parse(address);
  const SHA256 = CryptoJS.SHA256(addressHash);

  return Buffer.from(
    startByte +
      opDup +
      opHash +
      sigScheme +
      opPushHash +
      sigScheme +
      SHA256.toString(CryptoJS.enc.Hex) +
      opEqual +
      opVerify +
      opCheckSig +
      sigScheme,
    "hex"
  ).toString("base64");
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

export const checkOwnerPredicate = (key: string, predicate: string) => {
  if (!predicate || !key) return false;
  const hex = Buffer.from(predicate, "base64").toString("hex");
  const removeScriptBefore =
    startByte + opDup + opHash + sigScheme + opPushHash + sigScheme;
  const removeScriptAfter = opEqual + opVerify + opCheckSig + sigScheme;
  const sha256KeyFromPredicate = hex
    .replace(removeScriptBefore, "")
    .replace(removeScriptAfter, "");

  const checkedAddress = key.startsWith("0x") ? key.substring(2) : key;
  const addressHash = CryptoJS.enc.Hex.parse(checkedAddress);
  const SHA256Key = CryptoJS.SHA256(addressHash);

  return sha256KeyFromPredicate === SHA256Key.toString(CryptoJS.enc.Hex);
};

export const createNewBearer = (address: string) => {
  const checkedAddress = address.startsWith("0x")
    ? address.substring(2)
    : address;
  const addressHash = CryptoJS.enc.Hex.parse(checkedAddress);
  const SHA256 = CryptoJS.SHA256(addressHash);
  return Buffer.from(
    startByte +
      opDup +
      opHash +
      sigScheme +
      opPushHash +
      sigScheme +
      SHA256.toString(CryptoJS.enc.Hex) +
      opEqual +
      opVerify +
      opCheckSig +
      sigScheme,
    "hex"
  ).toString("base64");
};

export const createOwnerProof = async (
  msgHash: Uint8Array,
  hashingPrivateKey: Uint8Array,
  pubKey: Uint8Array
) => {
  const signature = await secp.sign(msgHash, hashingPrivateKey, {
    der: false,
    recovered: true,
  });

  const isValid = secp.verify(signature[0], msgHash, pubKey);

  return {
    isSignatureValid: isValid,
    ownerProof: Buffer.from(
      startByte +
        opPushSig +
        sigScheme +
        Buffer.from(
          secp.utils.concatBytes(signature[0], Buffer.from([signature[1]]))
        ).toString("hex") +
        opPushPubKey +
        sigScheme +
        unit8ToHexPrefixed(pubKey).substring(2),
      "hex"
    ).toString("base64"),
  };
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

export const getOptimalBills = (amount: string, billsArr: IBill[]): IBill[] => {
  if (!billsArr) {
    return [];
  }
  const selectedBills: IBill[] = [];
  const amountBigInt = BigInt(amount);
  const zeroBigInt = 0n;

  const closestBigger = findClosestBigger(billsArr, amount);
  if (closestBigger && BigInt(closestBigger.value) > zeroBigInt) {
    selectedBills.push(closestBigger);
  } else {
    const initialBill = getClosestSmaller(billsArr, amount);
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
          missingSum.toString()
        );
        if (closestBigger && BigInt(closestBigger.value) > zeroBigInt) {
          selectedBills.push(closestBigger);
          addedSum = BigInt(closestBigger.value);
        } else {
          const currentBill = getClosestSmaller(
            filteredBills,
            missingSum.toString()
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

export const getBillsSum = (bills: IBill[]) =>
  bills?.reduce((acc, obj: IBill) => {
    return acc + BigInt(obj.value);
  }, 0n);

export const getAssetSum = (asset: IFungibleAsset[]) =>
  asset?.reduce((acc, obj: IFungibleAsset) => {
    return acc + BigInt(obj.amount);
  }, 0n);

export const useDocumentClick = (
  callback: (event: MouseEvent) => void,
  ref: React.MutableRefObject<HTMLElement | null>
) => {
  const handler = useCallback(
    (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    },
    [callback, ref]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [ref, handler]);
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

export const invalidateAllLists = (
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
};

export const isTokenSendable = (invariantPredicate: string, key: string) => {
  const isOwner = checkOwnerPredicate(key, invariantPredicate);

  if (invariantPredicate === hexToBase64(pushBoolTrue)) {
    return true;
  } else if (isOwner) {
    return isOwner;
  }

  return false;
};

export const createInvariantPredicateSignatures = (
  hierarchy: ITypeHierarchy[],
  ownerProof: string,
  key: string
) => {
  return hierarchy?.map((parent: ITypeHierarchy) => {
    const predicate = parent.invariantPredicate;

    if (predicate === hexToBase64(pushBoolTrue)) {
      return hexToBase64(startByte);
    } else if (checkOwnerPredicate(key, predicate)) {
      return ownerProof;
    }
    throw new Error("Token can not be transferred");
  });
};

export const getTokensLabel = (typeId: string) =>
  typeId === AlphaType ? "bill" : "token";

export const getUpdatedNFTAssets = (
  NFTsList: IListTokensResponse[] | undefined = [],
  tokenTypes: ITokensListTypes[] | undefined = [],
  activeAccountId: string
) => {
  return (
    NFTsList?.map((nft) => {
      return Object.assign(nft, {
        isSendable: isTokenSendable(
          tokenTypes?.find((type: ITokensListTypes) => type.id === nft.typeId)
            ?.invariantPredicate!,
          activeAccountId
        ),
        amountOfSameType:
          NFTsList.filter(
            (obj: IListTokensResponse) => obj.typeId === nft.typeId
          )?.length || "0",
      });
    }) || []
  );
};

const getUpdatesUTPFungibleTokens = (
  fungibleTokensList: IListTokensResponse[] | undefined = [],
  tokenTypes: ITokensListTypes[] | undefined = [],
  activeAccountId: string
) => {
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
      name: obj.symbol,
      network: obj.network,
      amount: obj.amount?.toString(),
      decimalFactor: Number("1e" + obj.decimals),
      decimals: obj.decimals,
      isSendable: isTokenSendable(
        tokenTypes?.find((type: ITokensListTypes) => type.id === obj.typeId)
          ?.invariantPredicate!,
        activeAccountId
      ),
      UIAmount: separateDigits(
        addDecimal(obj.amount || "0", obj.decimals || 0)
      ),
    })) || []
  );
};

export const getUpdatedFungibleAssets = (
  fungibleTokensList: IListTokensResponse[] | undefined = [],
  tokenTypes: ITokensListTypes[] | undefined = [],
  activeAccountId: string,
  balances: any[]
) => {
  const fungibleUTPAssets = getUpdatesUTPFungibleTokens(
    fungibleTokensList,
    tokenTypes,
    activeAccountId
  );
  const ALPHABalance = balances?.find(
    (balance: any) => balance?.data?.pubKey === activeAccountId
  )?.data?.balance;

  const alphaAsset = {
    id: AlphaType,
    name: AlphaType,
    network: import.meta.env.VITE_NETWORK_NAME,
    amount: ALPHABalance,
    decimalFactor: AlphaDecimalFactor,
    decimals: AlphaDecimals,
    UIAmount: separateDigits(addDecimal(ALPHABalance || "0", AlphaDecimals)),
    typeId: AlphaType,
    isSendable: true,
  };

  const updatedFungibleAssets = sortBy(fungibleUTPAssets.concat([alphaAsset]), [
    "id",
  ]);

  return updatedFungibleAssets;
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

export const sendTransferMessage = (selectedAsset: INFTAsset | IFungibleAsset) => {
  chrome?.storage?.local.get(
    ["ab_connect_transfer_key_type_id"],
    function (transferRes) {
      if (
        selectedAsset?.typeId === transferRes.ab_connect_transfer_key_type_id
      ) {
        chrome?.runtime?.sendMessage({
          externalMessage: {
            ab_transferred_token_id: selectedAsset?.id,
          },
        });
      }
    }
  );
};
