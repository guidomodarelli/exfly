import type { MonthlyExpenseUsdRateType } from "./monthly-expenses-table.types";

/** User-facing labels (es-AR) for each per-expense USD rate type. */
export const USD_RATE_TYPE_LABELS: Record<MonthlyExpenseUsdRateType, string> = {
  blue: "Dólar blue",
  custom: "Personalizada",
  official: "Oficial",
  officialWithIibb: "Oficial + IIBB",
};

/** Rate types selectable from the row menu, in display order. */
export const USD_RATE_TYPE_MENU_ORDER: MonthlyExpenseUsdRateType[] = [
  "officialWithIibb",
  "official",
  "blue",
  "custom",
];
