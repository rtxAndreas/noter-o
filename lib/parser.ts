/**
 * Expression parser for Noter-O.
 * Strips parenthesized comments and currency units, then evaluates
 * basic arithmetic (+, -, *, /).
 * Adjacent numbers without an operator are implicitly added
 * (ex: "2000 1000" => 3000).
 * Supports French monetary notation: dots as thousand separators
 * (ex: "500.000" => 500000) and comma decimals ("10,5" => 10.5).
 */

const CURRENCY_UNITS =
  /\b(?:ar|ariary|arth|mg|eur?|€|\$|usd|gbp|£|jpy|¥)\b/gi;

export function parseExpression(input: string): number | null {
  const cleaned = stripCommentsAndUnits(input);
  if (!cleaned) return null;

  const mathExpr = extractMath(cleaned);
  if (!mathExpr) return null;

  return safeEval(mathExpr);
}

function stripCommentsAndUnits(input: string): string {
  let result = input;
  result = result.replace(/\([^)]*\)/g, "");
  result = result.replace(CURRENCY_UNITS, "");
  return result.trim();
}

function extractMath(cleaned: string): string | null {
  const tokenPattern = /[\d.,]+|\s*[+\-*/]\s*/g;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(cleaned)) !== null) {
    tokens.push(match[0].trim());
  }

  if (tokens.length === 0) return null;

  const mathTokens = tokens.filter(
    (t) => /^[\d.,]+$/.test(t) || /^[+\-*/]$/.test(t)
  );

  if (mathTokens.length === 0) return null;

  const normalized = mathTokens.map((t) => {
    if (/^[\d.,]+$/.test(t)) {
      return normalizeNumber(t);
    }
    return t;
  });

  const out: string[] = [];
  for (const token of normalized) {
    const isNumber = /^[\d.,]+$/.test(token);
    const prevIsNumber =
      out.length > 0 && /^[\d.,]+$/.test(out[out.length - 1]);
    if (isNumber && prevIsNumber) {
      out.push("+");
    }
    out.push(token);
  }

  return out.join(" ");
}

function normalizeNumber(numStr: string): string {
  const s = numStr.trim();

  // Dot thousands separators in groups of 3: "500.000" => 500000
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    return s.replace(/\./g, "");
  }

  // Comma decimals: "10,5" => 10.5, "1.234,56" => 1234.56
  if (/,\d{1,2}$/.test(s)) {
    const commaIdx = s.lastIndexOf(",");
    const intPart = s.slice(0, commaIdx).replace(/\./g, "");
    const decPart = s.slice(commaIdx + 1);
    return `${intPart}.${decPart}`;
  }

  // Otherwise remove commas (US thousands) and keep dots as decimals
  return s.replace(/,/g, "");
}

function safeEval(expr: string): number | null {
  try {
    if (!/^[\d.+\-*/\s]+$/.test(expr)) return null;

    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result !== "number" || !isFinite(result)) return null;

    return Math.round(result * 100) / 100; // 2 decimal places
  } catch {
    return null;
  }
}

export function formatResult(value: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  // French/Malagasy monetary norm: narrow spaces become dots
  return formatted.replace(/[\u00a0\u202f]/g, ".");
}
