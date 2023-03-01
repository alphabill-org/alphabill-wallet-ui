import { useCallback, useEffect, useRef } from "react";
import { getIn } from "formik";
import CryptoJS from "crypto-js";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";
import { uniq } from "lodash";
import * as secp from "@noble/secp256k1";
import BigNumber from "bignumber.js";
import { QueryClient } from "react-query";

import { IAccount, IBill, ITxProof } from "../types/Types";

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

export const unit8ToHexPrefixed = (key: Uint8Array) =>
  "0x" + Buffer.from(key).toString("hex");

export const base64ToHexPrefixed = (key: string = "") =>
  "0x" + Buffer.from(key, "base64").toString("hex");

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
  return password.length >= 8;
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
    decryptedVaultJSON?.entropy.length > 16 &&
    decryptedVaultJSON?.entropy.length < 32 &&
    decryptedVaultJSON?.entropy.length % 4 === 0
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
  target: BigNumber
): IBill | undefined => {
  return bills
    .sort(function (a: IBill, b: IBill) {
      return a.value - b.value;
    })
    .find(({ value }) => new BigNumber(value).isGreaterThanOrEqualTo(target));
};

export const getClosestSmaller = (
  bills: IBill[],
  target: BigNumber
): IBill => {
  return bills.reduce((acc: IBill, obj: IBill) =>
    new BigNumber(Math.abs(target.minus(obj.value).toNumber())).isLessThan(
      Math.abs(target.minus(acc.value).toNumber())
    )
      ? obj
      : acc
  );
};

export const getOptimalBills = (
  amount: BigNumber,
  billsArr: IBill[]
): IBill[] => {
  const selectedBills: IBill[] = [];

  const closestBigger = findClosestBigger(billsArr, amount);
  if (closestBigger && new BigNumber(closestBigger.value).isGreaterThan(0)) {
    selectedBills.push(closestBigger);
  } else {
    const initialBill = getClosestSmaller(billsArr, amount);
    selectedBills.push(initialBill);
    let missingSum = amount.minus(initialBill.value);

    while (missingSum.isGreaterThan(0)) {
      const filteredBills = billsArr.filter((bill) => !selectedBills.includes(bill));
      const filteredBillsSum = filteredBills.reduce(
        (acc: BigNumber, obj: IBill) => {
          return acc.plus(obj.value);
        },
        new BigNumber(0)
      );

      let addedSum;
      const closestBigger = findClosestBigger(
        filteredBills,
        new BigNumber(Math.abs(missingSum.toNumber()))
      );
      if (closestBigger && new BigNumber(closestBigger.value).isGreaterThan(0)) {
        selectedBills.push(closestBigger);
        addedSum = closestBigger.value;
      } else {
        const currentBill = getClosestSmaller(filteredBills, missingSum);
        selectedBills.push(currentBill);
        addedSum = currentBill.value;
      }
      missingSum = missingSum.minus(addedSum);
      if (filteredBillsSum.isLessThanOrEqualTo(0)) {
        break;
      }
    }
  }

  return selectedBills;
};

export const getBillsSum = (bills: IBill[]) =>
  bills.reduce((acc, obj: IBill) => {
    return new BigNumber(acc).plus(obj.value);
  }, new BigNumber(0));

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

export const getDecimalPlaces = (num: BigNumber) => {
  var match = ("" + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) {
    return 0;
  }
  return Math.max(
    0,
    (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0)
  );
};

export const convertToBigNumberString = (
  num: number,
  dividedBy: number = 1
): string => {
  if (isNaN(num)) return "";
  const bigNum = new BigNumber(num).dividedBy(dividedBy);
  const decimals = getDecimalPlaces(bigNum);
  return bigNum.toFixed(decimals);
};

export const invalidateAllLists = (
  pubKey: string,
  assetTypeId: string,
  queryClient: QueryClient
) => {
  queryClient.invalidateQueries(["tokenList", pubKey, assetTypeId]);
  queryClient.invalidateQueries(["tokensList", pubKey]);
  queryClient.invalidateQueries(["billsList", pubKey]);
  queryClient.invalidateQueries(["balance", pubKey]);
};

export const startByte = "53";
export const opPushSig = "54";
export const opPushPubKey = "55";
export const opDup = "76";
export const opHash = "a8";
export const opPushHash = "4f";
export const opCheckSig = "ac";
export const opEqual = "87";
export const opVerify = "69";
export const sigScheme = "01";
export const moneyTypeURL = "type.googleapis.com/rpc.";
export const tokensTypeURL = "type.googleapis.com/alphabill.tokens.v1.";

export const timeoutBlocks = 10;
export const swapTimeout = 40;
export const DCTransfersLimit = 100;
export const ALPHADecimalPlaces = 8;
export const ALPHADecimalFactor = Number("1e" + ALPHADecimalPlaces);
