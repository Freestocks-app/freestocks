import { describe, it, expect } from "vitest";
import { toBaseUnits, fromBaseUnits } from "./token-amount";

describe("toBaseUnits", () => {
  it("converts a whole number amount", () => {
    expect(toBaseUnits("25", 6)).toBe(BigInt(25_000_000));
  });

  it("converts a decimal amount", () => {
    expect(toBaseUnits("25.5", 6)).toBe(BigInt(25_500_000));
  });

  it("converts an 8-decimal xStock amount", () => {
    expect(toBaseUnits("0.14", 8)).toBe(BigInt(14_000_000));
  });

  it("truncates precision beyond the mint's decimals rather than rounding", () => {
    // 6 decimals can't represent the 7th digit - must truncate, not round up
    expect(toBaseUnits("1.1234567", 6)).toBe(BigInt(1_123_456));
  });

  it("handles a bare decimal point with only a fractional part", () => {
    expect(toBaseUnits(".5", 6)).toBe(BigInt(500_000));
  });

  it("handles zero", () => {
    expect(toBaseUnits("0", 6)).toBe(BigInt(0));
  });

  it("throws on empty input", () => {
    expect(() => toBaseUnits("", 6)).toThrow();
  });

  it("throws on non-numeric input", () => {
    expect(() => toBaseUnits("abc", 6)).toThrow();
  });

  it("throws on a lone decimal point", () => {
    expect(() => toBaseUnits(".", 6)).toThrow();
  });

  it("throws on negative amounts", () => {
    expect(() => toBaseUnits("-5", 6)).toThrow();
  });
});

describe("fromBaseUnits", () => {
  it("converts raw base units (bigint) back to a display number", () => {
    expect(fromBaseUnits(BigInt(25_500_000), 6)).toBe(25.5);
  });

  it("converts raw base units (string) back to a display number", () => {
    expect(fromBaseUnits("461484", 8)).toBeCloseTo(0.00461484, 8);
  });

  it("round-trips through toBaseUnits for a whole number", () => {
    const raw = toBaseUnits("100", 8);
    expect(fromBaseUnits(raw, 8)).toBe(100);
  });
});
