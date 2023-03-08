
import { assert, describe, expect, it } from 'vitest'
import {
  countDecimalLength,
  convertToWholeNumberBigInt,
  separateDigits,
  findClosestBigger,
  getClosestSmaller,
  getOptimalBills,
} from "../utils/utils";

describe("countDecimalLength", () => {
  it("returns 0 for a string without a decimal", () => {
    expect(countDecimalLength("123")).toBe(0);
  });

  it("returns the correct decimal length for a string with a decimal", () => {
    expect(countDecimalLength("123.456")).toBe(3);
  });
});

describe("convertToWholeNumberBigInt", () => {
  it("returns 0n for an invalid input", () => {
    expect(convertToWholeNumberBigInt("invalid", 0)).toBe(0n);
    expect(convertToWholeNumberBigInt(-1, 2)).toBe(0n);
  });

  it("converts a string to a whole number with the correct number of decimal places", () => {
    expect(convertToWholeNumberBigInt("123.456", 2)).toBe(BigInt("123456"));
  });

  it("converts a number to a whole number with the correct number of decimal places", () => {
    expect(convertToWholeNumberBigInt(123.456, 3)).toBe(BigInt("123456"));
  });
});

describe("separateDigits", () => {
  it("returns '0' for an invalid input", () => {
    expect(separateDigits("invalid")).toBe("0");
  });

  it("returns the correct formatting for an integer", () => {
    expect(separateDigits("123")).toBe("123");
    expect(separateDigits("123456789")).toBe("123'456'789");
  });

  it("returns the correct formatting for a decimal number", () => {
    expect(separateDigits("123.456")).toBe("123.456");
    expect(separateDigits("123456.789")).toBe("123'456.789");
    expect(separateDigits("123.4")).toBe("123.4");
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


describe('findClosestBigger', () => {
  it('should return the bill object that has a value greater than or equal to the target value', () => {
    const target = '300';

    const result = findClosestBigger(BILLS, target);

    expect(result).toEqual({
      id: "3",
      value: "500",
      txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzT=",
      isDcBill: false,
    });
  });

  it('should return undefined if there are no bills with a value greater than or equal to the target value', () => {
    const target = '1500';

    const result = findClosestBigger(BILLS, target);

    expect(result).toBeUndefined();
  });
});

describe('getClosestSmaller', () => {
  it('should return the bill object with the closest value to the target value', () => {
    const target = '300';

    const result = getClosestSmaller(BILLS, target);

    expect(result).toEqual({ id: "2", value: '200', txHash: "BzD2YH9Wy1aoUTiJZCHA5JbHUgc94b5rzdxAvheSfzY=", isDcBill: false });
  });
});

describe('getOptimalBills', () => {
  it('should return the optimal combination of bills to reach the target amount', () => {
    const amount = '1300';

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
      }
    ]);
  });

  it('should return an empty array if there are no bills to select from', () => {
    const emptyBills: any[] = [];
    const amount = '1300';

    const result = getOptimalBills(amount, emptyBills);

    expect(result).toEqual([]);
  });

  it('should return an array with the closest bill if there are no bills with a value greater than or equal to the target amount', () => {
    const amount = '1500';

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
      }
    ]);
  });
});