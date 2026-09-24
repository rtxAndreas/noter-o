import { describe, expect, it } from "vitest";
import { formatNumber } from "@/lib/formatNumber";

describe("formatNumber", () => {
  it("groups thousands with regular spaces", () => {
    expect(formatNumber(1000)).toBe("1 000");
    expect(formatNumber(3000000)).toBe("3 000 000");
  });

  it("keeps long raw digit strings precise", () => {
    expect(formatNumber("12345678901234567890")).toBe(
      "12 345 678 901 234 567 890"
    );
  });

  it("formats decimal calculation results in French", () => {
    expect(formatNumber(1500000.5)).toBe("1 500 000,5");
  });

  it("returns an empty string for invalid values", () => {
    expect(formatNumber("")).toBe("");
    expect(formatNumber("12abc")).toBe("");
    expect(formatNumber(Number.NaN)).toBe("");
  });
});
