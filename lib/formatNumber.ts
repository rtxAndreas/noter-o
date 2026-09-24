const FRENCH_SPACES = /[\s\u00a0\u202f]/g;

/**
 * Formats a number with French thousands separators.
 *
 * String values are useful for controlled inputs because they keep every raw
 * digit without converting through JavaScript's potentially imprecise number
 * type.
 */
export function formatNumber(value: number | string): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";

    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace(FRENCH_SPACES, " ");
  }

  const normalized = value
    .trim()
    .replace(FRENCH_SPACES, "")
    .replace(",", ".");

  if (!normalized) return "";
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return "";

  const sign = normalized.startsWith("-") ? "-" : "";
  const unsigned = sign ? normalized.slice(1) : normalized;
  const [integerPart, decimalPart] = unsigned.split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return `${sign}${groupedInteger}${
    decimalPart === undefined ? "" : `,${decimalPart}`
  }`;
}
