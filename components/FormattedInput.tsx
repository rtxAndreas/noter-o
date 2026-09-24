"use client";

import { useId, type ComponentProps } from "react";
import { formatNumber } from "@/lib/formatNumber";

export interface FormattedInputProps
  extends Omit<
    ComponentProps<"input">,
    "defaultValue" | "inputMode" | "onChange" | "type" | "value"
  > {
  value: number | string;
  onValueChange: (rawValue: string) => void;
  label?: string;
}

function cursorPositionAfterDigit(
  formattedValue: string,
  digitPosition: number
): number {
  if (digitPosition === 0) return 0;

  let digitsSeen = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) digitsSeen += 1;
    if (digitsSeen === digitPosition) return index + 1;
  }

  return formattedValue.length;
}

export default function FormattedInput({
  value,
  onValueChange,
  label,
  id,
  className = "",
  ...inputProps
}: FormattedInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const rawValue = String(value).replace(/\D/g, "");
  const formattedValue = formatNumber(rawValue);

  const input = (
    <input
      {...inputProps}
      id={inputId}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={formattedValue}
      onChange={(event) => {
        const typedValue = event.currentTarget.value;
        const cursor = event.currentTarget.selectionStart ?? typedValue.length;
        const digitsBeforeCursor = typedValue
          .slice(0, cursor)
          .replace(/\D/g, "").length;
        const nextRawValue = typedValue.replace(/\D/g, "");
        const nextFormattedValue = formatNumber(nextRawValue);
        const nextCursor = cursorPositionAfterDigit(
          nextFormattedValue,
          digitsBeforeCursor
        );

        // Keep the caret stable immediately, including when the parent state
        // already contains the same value (for example after typing a letter).
        event.currentTarget.value = nextFormattedValue;
        event.currentTarget.setSelectionRange(nextCursor, nextCursor);
        onValueChange(nextRawValue);
      }}
      className={`w-full rounded-xl bg-zinc-100 px-4 py-3 text-base tabular-nums text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${className}`}
    />
  );

  if (!label) return input;

  return (
    <label htmlFor={inputId} className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {input}
    </label>
  );
}
