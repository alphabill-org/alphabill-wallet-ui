import { useEffect, useRef } from "react";
import { getIn } from "formik";
import CryptoJS from "crypto-js";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync, entropyToMnemonic } from "bip39";
import { uniq } from "lodash";

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

  if (
    /^[\],:{}\s]*$/.test(
      CryptoJS.AES.decrypt(vault.toString(), password)
        .toString(CryptoJS.enc.Latin1)
        .replace(/\\["\\bfnrtu]/g, "@")
        .replace(
          /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+]?\d+)?/g,
          "]"
        )
        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
    )
  ) {
    const decryptedVault = JSON.parse(
      CryptoJS.AES.decrypt(vault.toString(), password).toString(
        CryptoJS.enc.Latin1
      )
    );

    if (
      decryptedVault?.entropy.length > 16 &&
      decryptedVault?.entropy.length < 32 &&
      decryptedVault?.entropy.length % 4 === 0
    ) {
      return {
        hashingPublicKey: null,
        hashingPrivateKey: null,
        error: "Password is incorrect!",
        decryptedVault: null,
        masterKey: null,
      };
    }

    const mnemonic = entropyToMnemonic(decryptedVault?.entropy);
    const seed = mnemonicToSeedSync(mnemonic);
    const masterKey = HDKey.fromMasterSeed(seed);
    const hashingKey = masterKey.derive(`m/44'/634'/${accountIndex}'/0/0`);
    const hashingPrivateKey = hashingKey.privateKey;
    const hashingPublicKey = hashingKey.publicKey;

    return {
      hashingPublicKey: hashingPublicKey,
      hashingPrivateKey: hashingPrivateKey,
      decryptedVault: decryptedVault,
      error: null,
      masterKey: masterKey,
      hashingKey: hashingKey,
    };
  } else {
    return {
      hashingPublicKey: null,
      hashingPrivateKey: null,
      error: "Password is incorrect!",
      decryptedVault: null,
      masterKey: null,
    };
  }
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
