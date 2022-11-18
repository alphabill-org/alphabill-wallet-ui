// @ts-ignore
import { useEffect, useRef } from "react";
import { getIn } from "formik";
// @ts-ignore

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

export const pubKeyToHex = (pubKey: Uint8Array) =>
  "0x" + Buffer.from(pubKey).toString("hex");

const bitLength = (number: number) => {
  return Math.floor(Math.log2(number)) + 1;
};

const byteLength = (number: number) => {
  return Math.ceil(bitLength(number) / 8);
};

export const getInt64Bytes = (x: number) => {
  let y= Math.floor(x/2**32);
  return [y,(y<<8),(y<<16),(y<<24), x,(x<<8),(x<<16),(x<<24)].map(z=> z>>>24)
}