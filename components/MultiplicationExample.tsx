"use client";

import { useState } from "react";
import { Equal, X } from "lucide-react";
import FormattedInput from "@/components/FormattedInput";
import { formatNumber } from "@/lib/formatNumber";

export default function MultiplicationExample() {
  const [amount, setAmount] = useState("1000");
  const [multiplier, setMultiplier] = useState("3");
  const result = amount && multiplier ? Number(amount) * Number(multiplier) : 0;

  return (
    <section
      aria-labelledby="quick-calculation-title"
      className="mx-4 mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="mb-3">
        <h2
          id="quick-calculation-title"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Calcul rapide
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Les espaces sont ajoutés pendant la saisie.
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
        <FormattedInput
          value={amount}
          onValueChange={setAmount}
          label="Montant"
          aria-label="Montant à multiplier"
          placeholder="0"
        />
        <X
          aria-hidden="true"
          className="mx-auto mb-3 hidden h-4 w-4 shrink-0 text-zinc-400 sm:block"
        />
        <FormattedInput
          value={multiplier}
          onValueChange={setMultiplier}
          label="Multiplicateur"
          aria-label="Multiplicateur"
          placeholder="0"
        />
        <Equal
          aria-hidden="true"
          className="mx-auto mb-3 hidden h-4 w-4 shrink-0 text-zinc-400 sm:block"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Résultat
          </span>
          <output
            aria-live="polite"
            aria-label="Résultat de la multiplication"
            className="flex min-h-12 items-center rounded-xl bg-emerald-50 px-4 py-3 text-base font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          >
            {formatNumber(result)}
          </output>
        </div>
      </div>
    </section>
  );
}
