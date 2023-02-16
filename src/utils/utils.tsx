import { useCallback, useEffect, useRef } from "react";
import { getIn } from "formik";
import CryptoJS from "crypto-js";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";
import { uniq } from "lodash";
import * as secp from "@noble/secp256k1";
import { differenceBy } from "lodash";
import BigNumber from "bignumber.js";

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

export const findClosestBigger = (bills: IBill[], target: number) =>
  bills
    .sort(function (a: IBill, b: IBill) {
      return a.value - b.value;
    })
    .find(({ value }) => value >= target);

export const getClosestSmaller = (bills: IBill[], target: number) =>
  bills.reduce((acc: IBill, obj: IBill) =>
    Math.abs(target - obj.value) < Math.abs(target - acc.value) ? obj : acc
  );

export const getOptimalBills = (amount: number, billsArr: IBill[]) => {
  let selectedBills: IBill[] = [];

  if (Number(findClosestBigger(billsArr, amount)?.value) > 0) {
    selectedBills = selectedBills.concat([
      findClosestBigger(billsArr, amount) as IBill,
    ]);
  } else {
    const initialBill = getClosestSmaller(billsArr, amount);
    selectedBills = selectedBills.concat([initialBill]);
    let missingSum = Number(amount) - initialBill.value;

    do {
      const filteredBills = differenceBy(billsArr, selectedBills, "id");

      const filteredBillsSum = filteredBills.reduce(
        (acc: number, obj: IBill) => {
          return acc + obj?.value;
        },
        0
      );
      let addedSum;

      if (
        Number(findClosestBigger(filteredBills, Math.abs(missingSum))?.value) >
        0
      ) {
        const currentBill = findClosestBigger(
          filteredBills,
          Math.abs(missingSum)
        );
        selectedBills = selectedBills.concat([currentBill as IBill]);
        addedSum = currentBill?.value || 0;
      } else {
        const currentBill = getClosestSmaller(
          filteredBills,
          Math.abs(missingSum)
        );
        selectedBills = selectedBills.concat([currentBill]);
        addedSum = currentBill?.value || 0;
      }
      missingSum = missingSum - addedSum;
      if (filteredBillsSum <= 0) {
        break;
      }
    } while (missingSum > 0);
  }

  return selectedBills;
};

export const getBillsSum = (bills: IBill[]) =>
  bills.reduce((acc: number, obj: IBill) => {
    return acc + obj?.value;
  }, 0);

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
export const moneyTypeURL = "type.googleapis.com/rpc";
export const tokensTypeURL = "type.googleapis.com/alphabill.tokens.v1";

export const timeoutBlocks = 10;
export const swapTimeout = 40;
export const DCTransfersLimit = 100;
export const ALPHADecimalPlaces = 8;
export const ALPHADecimalFactor = Number("1e" + ALPHADecimalPlaces);
