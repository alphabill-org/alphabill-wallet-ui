import { describe, expect, it, test } from "vitest";
import {
  countDecimalLength,
  convertToWholeNumberBigInt,
  separateDigits,
  findClosestBigger,
  getClosestSmaller,
  getOptimalBills,
  checkOwnerPredicate,
  createInvariantPredicateSignatures,
  isTokenSendable,
  hexToBase64,
  getUpdatedNFTAssets,
  getUpdatedFungibleAssets,
  createEllipsisString,
} from "../utils/utils";

import {
  OpPushPubKey,
  PushBoolFalse,
  PushBoolTrue,
  StartByte,
} from "../utils/constants";
import {
  activeAccountId,
  NFTsList_1,
  NFTsList_2,
  TokenTypes,
  NFTsList_3,
  updatedFungibleAssetsFalse,
  updatedFungibleAssetsTrue,
  FungibleTokensList_1,
  FungibleTokensList_2,
  FungibleTokenTypes,
  FungibleBalances,
  NFTDifferentTypeResult,
  NFTIsSendableFalseResult,
  NFTSameTypeResult,
  TestBills,
} from "./constants";

describe("Function that counts decimal length", () => {
  it("should return 0 for a string without a decimal", () => {
    expect(countDecimalLength("123")).toBe(0);
  });

  it("should return the correct decimal length for a string with a decimal", () => {
    expect(countDecimalLength("123.456")).toBe(3);
  });
});

describe("Function to convert a value with decimals to a whole number BigInt", () => {
  it("should convert a positive number with decimal places to a whole number", () => {
    expect(convertToWholeNumberBigInt(12232333332233.3, 2)).toEqual(
      BigInt(1223233333223330n)
    );
    expect(convertToWholeNumberBigInt(3.14, 2)).toEqual(BigInt(314));
  });
  it("should convert a string with a positive number with decimal places to a whole number", () => {
    expect(convertToWholeNumberBigInt("184467440737095516.15", 2)).toEqual(
      18446744073709551615n
    );
    expect(convertToWholeNumberBigInt("1844674407370955161.5", 2)).toEqual(
      184467440737095516150n
    );
    expect(convertToWholeNumberBigInt("18446744073709551615", 2)).toEqual(
      1844674407370955161500n
    );
    expect(convertToWholeNumberBigInt("3.1", 2)).toEqual(BigInt(310));
    expect(convertToWholeNumberBigInt("3.14", 2)).toEqual(BigInt(314));
  });
  it("should throw an error when the input is not valid", () => {
    expect(() => convertToWholeNumberBigInt("not a number", 2)).toThrow(
      "Converting to whole number failed: Input is not valid"
    );
  });
  it("should throw an error when the input is negative", () => {
    expect(() => convertToWholeNumberBigInt(-3.14, 2)).toThrow(
      "Converting to whole number failed: Input is not valid"
    );
  });
});

describe("Function return a formatted number string with separated digits", () => {
  it("should return a formatted number string with separated digits", () => {
    expect(separateDigits("123456.789")).toEqual("123'456.789");
    expect(separateDigits("9876543210.123456789")).toEqual(
      "9'876'543'210.123'456'789"
    );
    expect(separateDigits("0.123")).toEqual("0.123");
    expect(separateDigits("0.00000001")).toEqual("0.000'000'01");
    expect(separateDigits("1")).toEqual("1");
    expect(separateDigits("1844674407370955161.58978978")).toEqual(
      "1'844'674'407'370'955'161.589'789'78"
    );
    expect(separateDigits("18446744073709551615")).toEqual(
      "18'446'744'073'709'551'615"
    );
  });

  it("should throw an error if the input is not valid", () => {
    expect(() => separateDigits("")).toThrow(
      "Separating digits failed: Input is not valid"
    );
    expect(() => separateDigits("abc")).toThrow(
      "Separating digits failed: Input is not valid"
    );
    expect(() => separateDigits("-1")).toThrow(
      "Separating digits failed: Input is not valid"
    );
  });
});

describe("Function that finds an object that has a value greater than or equal to the target value", () => {
  it("should return the bill object that has a value greater than or equal to the target value", () => {
    const target = "300";

    const result = findClosestBigger(TestBills, target);

    expect(result).toEqual({
      id: "3",
      value: "500",
      txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT="
    });
  });

  it("should return undefined if there are no bills with a value greater than or equal to the target value", () => {
    const target = "1500";

    const result = findClosestBigger(TestBills, target);

    expect(result).toBeUndefined();
  });
});

describe("Function that gets closest value to the target value", () => {
  it("should return the bill object with the closest value to the target value", () => {
    const target = "300";

    const result = getClosestSmaller(TestBills, target);

    expect(result).toEqual({
      id: "2",
      value: "200",
      txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzY="
    });
  });
});

describe("Function that gets optimal combination of bills to reach the target amount", () => {
  it("should return the optimal combination of bills to reach the target amount", () => {
    const amount = "1300";

    const result = getOptimalBills(amount, TestBills);

    expect(result).toEqual([
      {
        id: "4",
        value: "1000",
        txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzV=",
      },
      {
        id: "3",
        value: "500",
        txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT=",
      },
    ]);
  });

  it("should return an empty array if there are no bills to select from", () => {
    const emptyBills: any[] = [];
    const amount = "1300";

    const result = getOptimalBills(amount, emptyBills);

    expect(result).toEqual([]);
  });

  it("should return an array with the closest bill if there are no bills with a value greater than or equal to the target amount", () => {
    const amount = "1500";

    const result = getOptimalBills(amount, TestBills);

    expect(result).toEqual([
      {
        id: "4",
        value: "1000",
        txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzV=",
      },
      {
        id: "3",
        value: "500",
        txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT=",
      },
    ]);
  });
});

describe("Check owner predicate", () => {
  test("should return true for a valid predicate and key", () => {
    const key =
      "0x03bf21600fb37a019d52e4e9ec4330ac66af681ce9354a579acb1f250463bc48e0";
    const predicate =
      "U3aoAU8BAJpIz9BB6HSvX5aCXub8H5N0W8zOgewrXqGmqjdQgb6HaawB";
    const result = checkOwnerPredicate(key, predicate);
    expect(result).toBe(true);
  });

  test("should return false for an invalid predicate and key", () => {
    const key = "0xabcdef";
    const predicate = "invalid_predicate";
    const result = checkOwnerPredicate(key, predicate);
    expect(result).toBe(false);
  });
});

describe("isTokenSendable", () => {
  test("should return false for a PushBoolFalse invariant predicate", () => {
    const invariantPredicate = PushBoolFalse;
    const key = "0xabcdef";
    const result = isTokenSendable(invariantPredicate, key);
    expect(result).toBe(false);
  });

  test("should return true for a PushBoolTrue invariant predicate", () => {
    const invariantPredicate = hexToBase64(PushBoolTrue);
    const key = "0xabcdef";
    const result = isTokenSendable(invariantPredicate, key);
    expect(result).toBe(true);
  });

  test("should return false for a invalid invariant predicate and key", () => {
    const invariantPredicate = hexToBase64(StartByte + OpPushPubKey + "abcdef");
    const key = "0xabcdef";
    const result = isTokenSendable(invariantPredicate, key);
    expect(result).toBe(false);
  });

  test("should return true for a valid invariant predicate and key", () => {
    const invariantPredicate =
      "U3aoAU8Bpq7mLmVAW3geOmYTUV0O/UO9KoEkXL4+Elv50KMzBQSHaawB";
    const key =
      "0x03bf21600fb37a019d52e4e9ec4330ac66af681ce9354a579acb1f250463bc48e0";
    const result = isTokenSendable(invariantPredicate, key);
    expect(result).toBe(false);
  });
});

describe("Create invariant predicate signatures", () => {
  test("should throw an error for an empty string invariant predicate", () => {
    const hierarchy = [
      {
        id: "AA==",
        parentTypeId: "AA==",
        symbol: "AA==",
        decimals: 2,
        kind: 2,
        txHash: "AA==",
        subTypeCreationPredicate: "AA==",
        tokenCreationPredicate: "AA==",
        invariantPredicate: "",
      },
    ];
    const ownerProof = Buffer.from("abcdef");
    const key = "0xabcdef";
    expect(() =>
      createInvariantPredicateSignatures(hierarchy, ownerProof, key)
    ).toThrow();
  });

  test("should throw an error for invariant predicate with null value", () => {
    const hierarchy: any = [
      {
        id: "AA==",
        parentTypeId: "AA==",
        symbol: "AA==",
        decimals: 2,
        kind: 2,
        txHash: "AA==",
        subTypeCreationPredicate: "AA==",
        tokenCreationPredicate: "AA==",
        invariantPredicate: null,
      },
    ];
    const ownerProof = Buffer.from("abcdef");
    const key = "0xabcdef";
    expect(() =>
      createInvariantPredicateSignatures(hierarchy, ownerProof, key)
    ).toThrow();
  });

  test("should throw an error for a PushBoolFalse invariant predicate", () => {
    const hierarchy = [
      {
        id: "AA==",
        parentTypeId: "AA==",
        symbol: "AA==",
        decimals: 2,
        kind: 2,
        txHash: "AA==",
        subTypeCreationPredicate: "AA==",
        tokenCreationPredicate: "AA==",
        invariantPredicate: PushBoolFalse,
      },
    ];
    const ownerProof = Buffer.from("abcdef");
    const key = "0xabcdef";
    expect(() =>
      createInvariantPredicateSignatures(hierarchy, ownerProof, key)
    ).toThrow();
  });

  test("should return true for a valid signatures if invariant predicate is ptpkh", () => {
    const hierarchy = [
      {
        id: "Qd6GsnoLOa7J3fO1PkA+1FBaJaGfcakJtGfLBxXogwQ=",
        parentTypeId: "AA==",
        symbol: "SSS",
        subTypeCreationPredicate: "U1EB",
        tokenCreationPredicate:
          "U3aoAU8Bpq7mLmVAW3geOmYTUV0O/UO9KoEkXL4+Elv50KMzBQSHaawB",
        invariantPredicate:
          "U3aoAU8Bpq7mLmVAW3geOmYTUV0O/UO9KoEkXL4+Elv50KMzBQSHaawB",
        decimals: 8,
        kind: 2,
        txHash: "PRH+z8hCfyz8tXjn7cZ/WCiQsg7z57x43Ye0TDhGFOA=",
      },
    ];
    const ownerProof = Buffer.from(
      "U1QBryqOLJ4CUOWKqwatYBlmkDV8xbMkVoRgNRZdDljo7H5GVspzamcU3rar93Nu",
      "base64"
    );
    const key =
      "0x024911ffe0b9521f2e09fa6d95b96ddfc15d20e6c2bafea067e5a730b7da40fe11";
    expect(
      createInvariantPredicateSignatures(hierarchy, ownerProof, key)
    ).toEqual(hierarchy?.map(() => ownerProof));
  });

  test("should return true for a valid signatures for valid predicate and key", () => {
    const hierarchy = [
      {
        id: "Qd6GsnoLOa7J3fO1PkA+1FBaJaGfcakJtGfLBxXogwQ=",
        parentTypeId: "AA==",
        symbol: "SSS",
        subTypeCreationPredicate: "U1EB",
        tokenCreationPredicate: "U1EB",
        invariantPredicate: "U1EB",
        decimals: 8,
        kind: 2,
        txHash: "PRH+z8hCfyz8tXjn7cZ/WCiQsg7z57x43Ye0TDhGFOA=",
      },
    ];
    const ownerProof = Buffer.from(
      "U1QBryqOLJ4CUOWKqwatYBlmkDV8xbMkVoRgNRZdDljo7H5GVspzamcU3rar93Nu",
      "base64"
    );
    const key =
      "0x03bf21600fb37a019d52e4e9ec4330ac66af681ce9354a579acb1f250463bc48e0";
    expect(
      createInvariantPredicateSignatures(hierarchy, ownerProof, key)
    ).toEqual([Buffer.from("Uw==", "base64")]);
  });
});

describe("Check if owner predicate", () => {
  const validKey =
    "0x024911ffe0b9521f2e09fa6d95b96ddfc15d20e6c2bafea067e5a730b7da40fe11";
  const validPredicate =
    "U3aoAU8Bpq7mLmVAW3geOmYTUV0O/UO9KoEkXL4+Elv50KMzBQSHaawB";
  const invalidKey =
    "0x1234567890123456789012345678901234567890123456789012345678901234";
  const invalidPredicate = "";

  it("returns true when the sha256KeyFromPredicate matches the SHA256 hash of the key parameter", () => {
    expect(checkOwnerPredicate(validKey, validPredicate)).toBe(true);
  });

  it("returns false when the sha256KeyFromPredicate does not match the SHA256 hash of the key parameter", () => {
    expect(checkOwnerPredicate(invalidKey, validPredicate)).toBe(false);
  });

  it("returns false when the predicate parameter is falsy", () => {
    expect(checkOwnerPredicate(validKey, invalidPredicate)).toBe(false);
  });

  it("returns false when both the key and predicate parameters are falsy", () => {
    expect(checkOwnerPredicate(invalidKey, invalidPredicate)).toBe(false);
  });

  it("returns false when predicate is null", () => {
    expect(checkOwnerPredicate(validKey, null as any)).toBe(false);
  });

  it("returns false when key is null", () => {
    expect(checkOwnerPredicate(null as any, validPredicate)).toBe(false);
  });
});

describe("Get updated NFT assets with is sendable & amount of same type", () => {
  it("should return updated NFT assets with correct properties with two of the same type", () => {
    const actualOutput = getUpdatedNFTAssets(
      NFTsList_1,
      TokenTypes,
      activeAccountId
    );

    expect(actualOutput).toEqual(NFTSameTypeResult);
  });

  it("should return updated NFT assets with correct properties with one of the each type", () => {
    const actualOutput = getUpdatedNFTAssets(
      NFTsList_2,
      TokenTypes,
      activeAccountId
    );

    expect(actualOutput).toEqual(NFTDifferentTypeResult);
  });

  it("should return updated NFT assets with correct properties with isSendable false", () => {
    const actualOutput = getUpdatedNFTAssets(
      NFTsList_3,
      TokenTypes,
      activeAccountId
    );

    expect(actualOutput).toEqual(NFTIsSendableFalseResult);
  });
});

describe("Get updated fungible assets with is sendable & sum of same type", () => {
  it("should return updated fungible assets with correct properties with UIAmount 30 & UTP isSendable true", () => {
    const actualOutput = getUpdatedFungibleAssets(
      FungibleTokensList_1,
      FungibleTokenTypes,
      activeAccountId,
      FungibleBalances
    );

    expect(actualOutput).toEqual(updatedFungibleAssetsTrue);
  });

  it("should return updated NFT assets with correct properties with UIAmount 30 & UTP isSendable false", () => {
    const actualOutput = getUpdatedFungibleAssets(
      FungibleTokensList_2,
      FungibleTokenTypes,
      activeAccountId,
      FungibleBalances
    );

    expect(actualOutput).toEqual(updatedFungibleAssetsFalse);
  });
});

describe('createEllipsisString', () => {
  it('should add ellipsis when the length of id is greater than the sum of firstCount and lastCount', () => {
    const id = 'abcdefghijklmnopqrstuvwxyz';
    const firstCount = 5;
    const lastCount = 5;

    const result = createEllipsisString(id, firstCount, lastCount);

    expect(result).toBe('abcde...vwxyz');
  });

  it('should return the original id when the length is less than or equal to the sum of firstCount and lastCount', () => {
    const id = 'short';
    const firstCount = 2;
    const lastCount = 2;

    const result = createEllipsisString(id, firstCount, lastCount);

    expect(result).toBe("sh...rt");
  });

  it('should return the original id when firstCount and lastCount are greater than or equal to the length of id', () => {
    const id = 'small';
    const firstCount = 10;
    const lastCount = 10;

    const result = createEllipsisString(id, firstCount, lastCount);

    expect(result).toBe(id);
  });
});