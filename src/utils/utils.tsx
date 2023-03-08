import { useCallback, useEffect, useRef } from "react";
import { getIn } from "formik";
import CryptoJS from "crypto-js";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";
import { uniq, isNumber } from "lodash";
import * as secp from "@noble/secp256k1";

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
  if (bills.length === 0) {
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
        const filteredBills = billsArr.filter(
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
  bills.reduce((acc, obj: IBill) => {
    return acc + BigInt(obj.value);
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
    return str.length - decimalIndex - 1;
  }
};

export const convertToWholeNumberBigInt = (
  val: string | number,
  decimalPlaces: number
): bigint => {
  let numStr = isNumber(val) ? val.toString() : val;
  const num = parseFloat(numStr);

  if (isNaN(num) || num <= 0) {
    return 0n;
  }

  const numStrWithoutDecimal = numStr.replace(".", "");
  const decimalDifference = decimalPlaces - countDecimalLength(numStr);
  const fullNumber =
    decimalDifference > 0
      ? numStrWithoutDecimal + "0".repeat(decimalDifference)
      : numStrWithoutDecimal;

  return BigInt(fullNumber);
};

export const separateDigits = (numStr: string) => {
  const num = parseFloat(numStr);

  if (isNaN(num)) {
    return "0";
  }

  const [integerPart, decimalPart = ""] = num.toString().split(".");
  const formattedIntegerPart = parseInt(integerPart, 10)
    .toLocaleString()
    .replace(/,/g, "'");

  if (decimalPart.length > 0) {
    const roundedDecimalPart = parseFloat(`0.${decimalPart}`).toFixed(8);
    const formattedDecimalPart = roundedDecimalPart
      .slice(2)
      .replace(/0+$/, "")
      .replace(/(\d{3})(?=\d)/g, "$1'"); // updated regular expression
    return `${formattedIntegerPart}.${formattedDecimalPart}`;
  }

  return formattedIntegerPart;
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

export const timeoutBlocks = 10n;
export const swapTimeout = 40n;
export const DCTransfersLimit = 100;
export const ALPHADecimalPlaces = 8;
export const ALPHADecimalFactor = Number("1e" + ALPHADecimalPlaces);
