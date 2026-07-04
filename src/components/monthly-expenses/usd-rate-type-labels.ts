import type {
  MonthlyExpenseUsdRateBase,
  MonthlyExpenseUsdRateSettings,
} from "./monthly-expenses-table.types";

/** User-facing labels (es-AR) for each USD base quote. */
export const USD_RATE_BASE_LABELS: Record<MonthlyExpenseUsdRateBase, string> = {
  blue: "Dólar blue",
  custom: "Personalizada",
  official: "Oficial",
};

/** Base quotes selectable from the row menu, in display order. */
export const USD_RATE_BASE_MENU_ORDER: MonthlyExpenseUsdRateBase[] = [
  "official",
  "blue",
  "custom",
];

export const USD_RATE_IIBB_SURCHARGE_LABEL = "Sumar IIBB";
export const USD_RATE_IVA_SURCHARGE_LABEL = "Sumar IVA 21%";

/**
 * Compact badge label for a row's USD rate settings, e.g. "blue + IIBB",
 * "oficial + IIBB + IVA" or "manual".
 */
export function getUsdRateBadgeLabel(
  usdRate: MonthlyExpenseUsdRateSettings,
): string {
  const baseLabel =
    usdRate.base === "blue"
      ? "blue"
      : usdRate.base === "official"
        ? "oficial"
        : "manual";

  return [
    baseLabel,
    usdRate.appliesIibb ? "+ IIBB" : null,
    usdRate.appliesIva ? "+ IVA" : null,
  ]
    .filter(Boolean)
    .join(" ");
}
