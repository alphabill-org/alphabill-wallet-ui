import { describe, expect, it } from "vitest";
import {
  countDecimalLength,
  convertToWholeNumberBigInt,
  separateDigits,
  findClosestBigger,
  getClosestSmaller,
  getOptimalBills,
} from "../utils/utils";

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

const BILLS = [
  {
    id: "1",
    value: "100",
    txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzR=",
    isDcBill: false,
  },
  {
    id: "2",
    value: "200",
    txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzY=",
    isDcBill: false,
  },
  {
    id: "3",
    value: "500",
    txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT=",
    isDcBill: false,
  },
  {
    id: "4",
    value: "1000",
    txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzV=",
    isDcBill: false,
  },
];

describe("Function that finds an object that has a value greater than or equal to the target value", () => {
  it("should return the bill object that has a value greater than or equal to the target value", () => {
    const target = "300";

    const result = findClosestBigger(BILLS, target);

    expect(result).toEqual({
      id: "3",
      value: "500",
      txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT=",
      isDcBill: false,
    });
  });

  it("should return undefined if there are no bills with a value greater than or equal to the target value", () => {
    const target = "1500";

    const result = findClosestBigger(BILLS, target);

    expect(result).toBeUndefined();
  });
});

describe("Function that gets closest value to the target value", () => {
  it("should return the bill object with the closest value to the target value", () => {
    const target = "300";

    const result = getClosestSmaller(BILLS, target);

    expect(result).toEqual({
      id: "2",
      value: "200",
      txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzY=",
      isDcBill: false,
    });
  });
});

describe("Function that gets optimal combination of bills to reach the target amount", () => {
  it("should return the optimal combination of bills to reach the target amount", () => {
    const amount = "1300";

    const result = getOptimalBills(amount, BILLS);

    expect(result).toEqual([
      {
        id: "4",
        value: "1000",
        txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzV=",
        isDcBill: false,
      },
      {
        id: "3",
        value: "500",
        txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT=",
        isDcBill: false,
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

    const result = getOptimalBills(amount, BILLS);

    expect(result).toEqual([
      {
        id: "4",
        value: "1000",
        txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzV=",
        isDcBill: false,
      },
      {
        id: "3",
        value: "500",
        txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT=",
        isDcBill: false,
      },
    ]);
  });
});
