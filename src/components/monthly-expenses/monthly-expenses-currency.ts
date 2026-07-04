import type {
  ExchangeRateSnapshot,
  MonthlyExpenseCurrency,
  MonthlyExpensesEditableRow,
  MonthlyExpenseUsdRateType,
} from "./monthly-expenses-table.types";
import { DEFAULT_USD_RATE_TYPE } from "./monthly-expenses-table.types";

const CURRENCY_FORMATTER_BY_CURRENCY: Record<
  MonthlyExpenseCurrency,
  Intl.NumberFormat
> = {
  ARS: new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }),
  USD: new Intl.NumberFormat("es-AR", {
    currency: "USD",
    style: "currency",
  }),
};

/** Formats a raw string amount in its own currency, echoing non-numeric input. */
export function formatCurrencyAmount(
  currency: MonthlyExpenseCurrency,
  value: string,
): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return CURRENCY_FORMATTER_BY_CURRENCY[currency].format(numericValue);
}

/** Formats an already-converted numeric amount, using "-" for missing values. */
export function formatConvertedAmount(
  currency: MonthlyExpenseCurrency,
  value: number | null,
): string {
  if (value == null) {
    return "-";
  }

  return CURRENCY_FORMATTER_BY_CURRENCY[currency].format(value);
}

/** Formats an exchange-rate figure as a plain ARS amount (no currency code). */
export function formatExchangeRateAmount(value: number): string {
  return `$ ${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)}`;
}

/**
 * Resolves the ARS-per-USD rate for a row given its rate type. Returns `null`
 * when the snapshot is unavailable or the custom rate is missing/invalid.
 */
export function getUsdRateForRow({
  customUsdRate,
  exchangeRateSnapshot,
  usdRateType,
}: {
  customUsdRate: number | null;
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
  usdRateType: MonthlyExpenseUsdRateType;
}): number | null {
  if (usdRateType === "custom") {
    return typeof customUsdRate === "number" &&
      Number.isFinite(customUsdRate) &&
      customUsdRate > 0
      ? customUsdRate
      : null;
  }

  if (!exchangeRateSnapshot) {
    return null;
  }

  if (usdRateType === "blue") {
    return exchangeRateSnapshot.blueRate;
  }

  if (usdRateType === "official") {
    return exchangeRateSnapshot.officialRate;
  }

  return exchangeRateSnapshot.solidarityRate;
}

/**
 * Converts a row amount into the requested currency using the row's USD rate
 * type (solidarity rate by default). Returns `null` when the amount is not
 * finite or no usable rate is available.
 */
export function getConvertedAmountForCurrency({
  currency,
  customUsdRate = null,
  exchangeRateSnapshot,
  rowCurrency,
  total,
  usdRateType = DEFAULT_USD_RATE_TYPE,
}: {
  currency: MonthlyExpenseCurrency;
  customUsdRate?: number | null;
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
  rowCurrency: MonthlyExpenseCurrency;
  total: number;
  usdRateType?: MonthlyExpenseUsdRateType;
}): number | null {
  if (!Number.isFinite(total)) {
    return null;
  }

  if (currency === rowCurrency) {
    return total;
  }

  const usdRate = getUsdRateForRow({
    customUsdRate,
    exchangeRateSnapshot,
    usdRateType,
  });

  if (usdRate == null) {
    return null;
  }

  return currency === "ARS" ? total * usdRate : total / usdRate;
}

/** Returns a row amount expressed in ARS for cross-currency comparison/sorting. */
export function getArsComparableAmount({
  customUsdRate = null,
  exchangeRateSnapshot,
  rowCurrency,
  usdRateType = DEFAULT_USD_RATE_TYPE,
  value,
}: {
  customUsdRate?: number | null;
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
  rowCurrency: MonthlyExpenseCurrency;
  usdRateType?: MonthlyExpenseUsdRateType;
  value: string;
}): number | null {
  return getConvertedAmountForCurrency({
    currency: "ARS",
    customUsdRate,
    exchangeRateSnapshot,
    rowCurrency,
    total: Number(value),
    usdRateType,
  });
}

/** Sums the given rows in the requested currency, ignoring unconvertible rows. */
export function getConvertedTotalAmount({
  currency,
  exchangeRateSnapshot,
  rows,
}: {
  currency: MonthlyExpenseCurrency;
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
  rows: MonthlyExpensesEditableRow[];
}): number | null {
  let total = 0;
  let hasValues = false;

  for (const row of rows) {
    const convertedAmount = getConvertedAmountForCurrency({
      currency,
      customUsdRate: row.customUsdRate,
      exchangeRateSnapshot,
      rowCurrency: row.currency,
      total: Number(row.total),
      usdRateType: row.usdRateType,
    });

    if (convertedAmount == null) {
      continue;
    }

    total += convertedAmount;
    hasValues = true;
  }

  return hasValues ? total : null;
}
