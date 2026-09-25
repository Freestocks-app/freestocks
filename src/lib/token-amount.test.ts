import { describe, it, expect } from "vitest";
import { toBaseUnits, fromBaseUnits, formatTokenAmount } from "./token-amount";

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

describe("formatTokenAmount", () => {
  it("formats zero as a plain 0", () => {
    expect(formatTokenAmount(0, 8)).toBe("0");
  });

  it("never falls back to exponential notation for a very small amount", () => {
    // This is the exact bug report: 0.0000008026 rendered as "8.026e-7" via
    // JS's default number-to-string, which reads as garbage/0 to a user.
    const result = formatTokenAmount(0.0000008026, 8);
    expect(result).not.toMatch(/e[+-]/i);
    expect(result).toBe("0.0000008");
  });

  it("trims trailing zeros for a round number but keeps at least 2 decimals", () => {
    expect(formatTokenAmount(3.5, 8)).toBe("3.50");
  });

  it("keeps a whole number readable with 2 decimal places", () => {
    expect(formatTokenAmount(100, 8)).toBe("100.00");
  });

  it("does not truncate meaningful precision within the mint's decimals", () => {
    expect(formatTokenAmount(0.01494, 8)).toBe("0.01494");
  });

  it("respects a smaller decimals count (e.g. USDC-like 6 decimals)", () => {
    expect(formatTokenAmount(0.000123, 6)).toBe("0.000123");
  });

  it("falls back to the full rounded string rather than showing 0 when rounding to `decimals` would otherwise erase every digit", () => {
    // 0.0000005 rounds to "0.000000" at 6 decimals (below that precision's
    // smallest representable unit) - must never silently collapse to "0"
    // for a genuinely nonzero balance.
    const result = formatTokenAmount(0.0000005, 6);
    expect(result).not.toBe("0");
    expect(result).toBe("0.000000");
  });
});
