import { describe, expect, it } from "vitest";
import { parseExpression, formatResult } from "@/lib/parser";

describe("parseExpression", () => {
  it("parses a simple addition", () => {
    expect(parseExpression("20000 + 3000")).toBe(23000);
  });

  it("parses a simple subtraction", () => {
    expect(parseExpression("5000 - 1500")).toBe(3500);
  });

  it("parses multiplication", () => {
    expect(parseExpression("1000 * 5")).toBe(5000);
  });

  it("parses division", () => {
    expect(parseExpression("10000 / 4")).toBe(2500);
  });

  it("parses complex expressions respecting precedence", () => {
    expect(parseExpression("2 + 3 * 4")).toBe(14);
    expect(parseExpression("2 * 3 + 4")).toBe(10);
    expect(parseExpression("100 - 20 * 3")).toBe(40);
  });

  it("adds adjacent numbers implicitly", () => {
    expect(parseExpression("2000 1000")).toBe(3000);
    expect(parseExpression("gouter 2000ar (operateur) 1000 bus")).toBe(3000);
    expect(parseExpression("500 500 500")).toBe(1500);
  });

  it("does not break explicit operators with implicit addition", () => {
    expect(parseExpression("3 * 4 5")).toBe(17);
    expect(parseExpression("100 - 20 10")).toBe(90);
  });

  it("strips parenthesized comments", () => {
    expect(parseExpression("20000ar (carburant) + 3000")).toBe(23000);
    expect(parseExpression("1000 (trose) * 5")).toBe(5000);
  });

  it("strips currency units", () => {
    expect(parseExpression("20000ar + 3000ar")).toBe(23000);
    expect(parseExpression("100 $ + 50 USD")).toBe(150);
    expect(parseExpression("25€ * 4")).toBe(100);
  });

  it("treats dots as thousands separators in groups of 3", () => {
    expect(parseExpression("500.000")).toBe(500000);
    expect(parseExpression("100.000 / 10")).toBe(10000);
    expect(parseExpression("100.000 + 400.000")).toBe(500000);
    expect(parseExpression("loyer 100.000 (cent mille ariary) + provision 400.000 ar")).toBe(
      500000
    );
  });

  it("interprets a single dot as decimal separator", () => {
    expect(parseExpression("0.5 * 4")).toBe(2);
    expect(parseExpression("10.5 + 1.5")).toBe(12);
  });

  it("handles comma as decimal separator", () => {
    expect(parseExpression("10,5 + 1.5")).toBe(12);
    expect(parseExpression("1.234,56")).toBe(1234.56);
    expect(parseExpression("1.500.000,50")).toBe(1500000.5);
  });

  it("handles thousand separators", () => {
    expect(parseExpression("1,000 + 500")).toBe(1500);
    expect(parseExpression("10,000,000 + 1")).toBe(10000001);
  });

  it("rounds to 2 decimal places", () => {
    expect(parseExpression("10 / 3")).toBe(3.33);
    expect(parseExpression("1 / 4")).toBe(0.25);
  });

  it("supports negative numbers", () => {
    expect(parseExpression("-5 + 10")).toBe(5);
  });

  it("returns null for empty input", () => {
    expect(parseExpression("")).toBeNull();
    expect(parseExpression("   ")).toBeNull();
  });

  it("returns null when no math tokens exist", () => {
    expect(parseExpression("bonjour")).toBeNull();
    expect(parseExpression("(commentaire)")).toBeNull();
  });

  it("returns null for invalid expressions", () => {
    expect(parseExpression("abc + xyz")).toBeNull();
    expect(parseExpression("2 +")).toBeNull();
    expect(parseExpression("**")).toBeNull();
  });
});

describe("formatResult", () => {
  it("uses spaces as French thousand separators", () => {
    expect(formatResult(23000)).toBe("23 000");
    expect(formatResult(500000)).toBe("500 000");
    expect(formatResult(10000)).toBe("10 000");
    expect(formatResult(200000)).toBe("200 000");
    expect(formatResult(1000000)).toBe("1 000 000");
  });

  it("formats numbers with comma decimals", () => {
    expect(formatResult(23000.5)).toBe("23 000,5");
    expect(formatResult(1500000.5)).toBe("1 500 000,5");
  });

  it("formats small numbers without separators", () => {
    expect(formatResult(0)).toBe("0");
    expect(formatResult(999)).toBe("999");
  });
});
