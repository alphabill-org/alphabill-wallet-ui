import { describe, expect, it } from "vitest";
import {
  countDecimalLength,
  convertToWholeNumberBigInt,
  separateDigits,
  findClosestBigger,
  getClosestSmaller,
  getOptimalBills,
  getUpdatedNFTAssets,
  handleBillSelection,
  createEllipsisString,
  getBillsAndTargetUnitToConsolidate,
  isBillLocked,
  unlockedBills,
  findBillWithLargestValue,
} from "../utils/utils";

import {
  NFTsList_1,
  NFTsList_2,
  NFTsList_3,
  NFTDifferentTypeResult,
  NFTIsSendableFalseResult,
  NFTSameTypeResult,
  TestBills,
  ExpectedBill1000,
  ExpectedBill200,
  ExpectedBill500,
} from "./constants";
import { IBill } from "../types/Types";

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
      txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT=",
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
      txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzY=",
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

describe("Get updated NFT assets with is sendable & amount of same type", () => {
  it("should return updated NFT assets with correct properties with two of the same type", () => {
    const actualOutput = getUpdatedNFTAssets(NFTsList_1);
    expect(actualOutput).toEqual(NFTSameTypeResult);
  });

  it("should return updated NFT assets with correct properties with one of the each type", () => {
    const actualOutput = getUpdatedNFTAssets(NFTsList_2);
    expect(actualOutput).toEqual(NFTDifferentTypeResult);
  });

  it("should return updated NFT assets with correct properties with isSendable false", () => {
    const actualOutput = getUpdatedNFTAssets(NFTsList_3);
    expect(actualOutput).toEqual(NFTIsSendableFalseResult);
  });
});

describe("handleBillSelection function", () => {
  it("should split the bill without fee", () => {
    const convertedAmount = "1200";
    const {
      optimalBills,
      billsToTransfer,
      billToSplit,
      splitBillAmount,
    } = handleBillSelection(convertedAmount, TestBills);

    // Assert the results based on your expectations
    expect(optimalBills.length).toBe(2);
    expect(billsToTransfer.length).toBe(2);
    expect(billToSplit).toEqual(null); // Since billsSumDifference === 0n
    expect(splitBillAmount).toEqual(null); // Since billToSplit is null
  });

  it("should split the bill with a fee of 50", () => {
    const convertedAmount = "1200";
    const feeAmount = 50n;
    const {
      optimalBills,
      billsToTransfer,
      billToSplit,
      splitBillAmount,
    } = handleBillSelection(convertedAmount, TestBills, feeAmount);

    // Assert the results based on your expectations
    expect(optimalBills.length).toBe(2);
    expect(billsToTransfer.length).toBe(1);
    expect(billToSplit).toEqual(ExpectedBill500);
    // Fee amount is deducted on every transfer
    expect(splitBillAmount).toEqual(
      200n + BigInt(optimalBills.length) * feeAmount
    );
  });

  it("should select specific bills in optimalBills array", () => {
    const convertedAmount = "1200";
    const { optimalBills } = handleBillSelection(convertedAmount, TestBills);

    // Use the toContainEqual matcher to check if the optimalBills array contains the expected bill objects
    expect(optimalBills).toEqual([ExpectedBill1000, ExpectedBill200]);
  });

  // Add more test cases with expectedBills
  it("should select specific bills and split the bill", () => {
    const convertedAmount = "300"; // Less than the total value of bills
    const feeAmount = 50n;
    const {
      optimalBills,
      billsToTransfer,
      billToSplit,
      splitBillAmount,
    } = handleBillSelection(convertedAmount, TestBills, feeAmount);

    // Use the toContainEqual matcher to check if the optimalBills array contains the expected bill objects
    expect(optimalBills).toEqual([ExpectedBill1000]);

    // Ensure that the actual billsToTransfer and billToSplit match the ExpectedBills
    expect(billsToTransfer).toEqual([]);
    expect(billToSplit).toEqual(ExpectedBill1000);

    // Fee amount is deducted on every transfer
    const expectedSplitBillAmount =
      300n + BigInt(optimalBills.length) * feeAmount;

    // Ensure that the actual splitBillAmount matches the expected splitBillAmount
    expect(splitBillAmount).toEqual(expectedSplitBillAmount);
  });
});

describe("createEllipsisString", () => {
  it("should add ellipsis when the length of id is greater than the sum of firstCount and lastCount", () => {
    const id = "abcdefghijklmnopqrstuvwxyz";
    const firstCount = 5;
    const lastCount = 5;

    const result = createEllipsisString(id, firstCount, lastCount);

    expect(result).toBe("abcde...vwxyz");
  });

  it("should return the original id when firstCount and lastCount are greater than or equal to the length of id", () => {
    const id = "small";
    const firstCount = 10;
    const lastCount = 10;

    const result = createEllipsisString(id, firstCount, lastCount);

    expect(result).toBe(id);
  });
});

describe("isBillLocked", () => {
  const consolidationTargetUnit = { id: "123" } as IBill;
  const asset = { id: "123" } as IBill;
  const DCBills = [{ targetUnitId: "123" }] as IBill[];

  it("returns true when consolidation target unit and DCBills match", () => {
    const result = isBillLocked(consolidationTargetUnit, asset, DCBills);
    expect(result).toBe(true);
  });

  it("returns false when consolidation target unit and DCBills do not match", () => {
    const result = isBillLocked(
      consolidationTargetUnit,
      { id: "456" } as IBill,
      DCBills
    );
    expect(result).toBe(false);
  });

  it("returns false when DCBills is empty", () => {
    const result = isBillLocked(consolidationTargetUnit, asset, []);
    expect(result).toBe(false);
  });
});

describe("unlockedBills", () => {
  const bills = [
    { id: "123", targetUnitId: "456" },
    { id: "789", targetUnitId: null },
  ] as IBill[];

  it("returns unlocked bills", () => {
    const result = unlockedBills(bills);
    expect(result).toEqual([{ id: "789", targetUnitId: null }]);
  });

  it("returns an empty array when all bills are locked", () => {
    const bills = [
      { id: "123", targetUnitId: "456" },
      { id: "789", targetUnitId: "456" },
    ];
    const result = unlockedBills(bills as IBill[]);
    expect(result).toEqual([]);
  });
});

describe("getBillsAndTargetUnitToConsolidate", () => {
  const billsList = [
    { id: "123", targetUnitId: null },
    { id: "456", targetUnitId: "789" },
  ] as IBill[];

  it("returns bills to consolidate and target unit", () => {
    const result = getBillsAndTargetUnitToConsolidate(billsList);
    expect(result).toEqual({
      billsToConsolidate: [],
      consolidationTargetUnit: { id: "123", targetUnitId: null },
    });
  });

  it("returns an empty array of bills to consolidate when all bills are locked", () => {
    const billsList = [
      { id: "123", targetUnitId: "456" },
      { id: "789", targetUnitId: "456" },
    ] as IBill[];
    const result = getBillsAndTargetUnitToConsolidate(billsList);
    expect(result.billsToConsolidate).toEqual([]);
  });

  it("returns undefined target unit when no collectable bills", () => {
    const billsList = [{ id: "123", targetUnitId: "456" }] as IBill[];
    const result = getBillsAndTargetUnitToConsolidate(billsList);
    expect(result.consolidationTargetUnit).toBeNull();
  });
});

const bills = [
  {
    id: "It6cBuKffVzE5dgM6zbqvZ9dKDu+UIX/t6DIOcQRbs8V8A",
    value: "198900000000",
    txHash: "QzIbi6oYuI6agSOdRth8L7pru/eN+ZCrds+wD2UbPM4=",
    typeId: "ALPHA",
    name: "ALPHA",
    network: "AB Devnet",
    decimals: 8,
    isSendable: true,
  },
  {
    id: "It6sscBuKVzE5dgM6zbqvZ9dKDu+UIX/t6DIOcQRbs8V8A",
    value: "98900000000",
    txHash: "QzIbi6oYuI6agSOdRth8L7pru/eN+ZCrds+wD2UbPM4=",
    typeId: "ALPHA",
    name: "ALPHA",
    network: "AB Devnet",
    decimals: 8,
    isSendable: true,
  },
];

describe("findBillWithLargestValue", () => {
  it("should return null for an empty array", () => {
    const result = findBillWithLargestValue([]);
    expect(result).toBeNull();
  });

  it("should return the bill with the largest value when values are numeric strings", () => {
    const result = findBillWithLargestValue(bills);
    expect(result).toEqual({
      id: "It6cBuKffVzE5dgM6zbqvZ9dKDu+UIX/t6DIOcQRbs8V8A",
      value: "198900000000",
      txHash: "QzIbi6oYuI6agSOdRth8L7pru/eN+ZCrds+wD2UbPM4=",
      typeId: "ALPHA",
      name: "ALPHA",
      network: "AB Devnet",
      decimals: 8,
      isSendable: true,
    });
  });
});
