import type {
  ExchangeRateSnapshot,
  MonthlyExpenseCurrency,
  MonthlyExpensesEditableRow,
  MonthlyExpenseUsdRateSettings,
} from "./monthly-expenses-table.types";
import {
  DEFAULT_USD_RATE_SETTINGS,
  USD_RATE_IVA_DECIMAL,
} from "./monthly-expenses-table.types";

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

function getBaseUsdRate(
  usdRate: MonthlyExpenseUsdRateSettings,
  exchangeRateSnapshot: ExchangeRateSnapshot | null,
): number | null {
  if (usdRate.base === "custom") {
    return typeof usdRate.customRate === "number" &&
      Number.isFinite(usdRate.customRate) &&
      usdRate.customRate > 0
      ? usdRate.customRate
      : null;
  }

  if (!exchangeRateSnapshot) {
    return null;
  }

  return usdRate.base === "blue"
    ? exchangeRateSnapshot.blueRate
    : exchangeRateSnapshot.officialRate;
}

/**
 * Derives the month's IIBB perception as a decimal of the base rate from the
 * snapshot. The solidario is defined as `oficial × (1 + IIBB + IVA)`, so the
 * IIBB decimal is recovered as `solidario/oficial - 1 - IVA`. Returns `null`
 * when the snapshot is missing or the official quote is not usable.
 */
function getIibbDecimalFromSnapshot(
  exchangeRateSnapshot: ExchangeRateSnapshot | null,
): number | null {
  if (!exchangeRateSnapshot || exchangeRateSnapshot.officialRate <= 0) {
    return null;
  }

  return (
    exchangeRateSnapshot.solidarityRate / exchangeRateSnapshot.officialRate -
    1 -
    USD_RATE_IVA_DECIMAL
  );
}

/**
 * Resolves the effective ARS-per-USD rate for a row: its base quote plus the
 * optional IIBB perception and the optional 21% VAT. Both surcharges stack
 * additively over the base (`base × (1 + IIBB + IVA)`), so enabling both never
 * double-counts the VAT. Returns `null` when a needed quote is missing.
 */
export function getUsdRateForRow({
  exchangeRateSnapshot,
  usdRate,
}: {
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
  usdRate: MonthlyExpenseUsdRateSettings;
}): number | null {
  const baseUsdRate = getBaseUsdRate(usdRate, exchangeRateSnapshot);

  if (baseUsdRate == null) {
    return null;
  }

  let surchargeDecimal = 0;

  if (usdRate.appliesIibb) {
    const iibbDecimal = getIibbDecimalFromSnapshot(exchangeRateSnapshot);

    if (iibbDecimal == null) {
      return null;
    }

    surchargeDecimal += iibbDecimal;
  }

  if (usdRate.appliesIva) {
    surchargeDecimal += USD_RATE_IVA_DECIMAL;
  }

  return baseUsdRate * (1 + surchargeDecimal);
}

/**
 * Converts a row amount into the requested currency using the row's USD rate
 * settings (official + IIBB by default). Returns `null` when the amount is
 * not finite or no usable rate is available.
 */
export function getConvertedAmountForCurrency({
  currency,
  exchangeRateSnapshot,
  rowCurrency,
  total,
  usdRate = DEFAULT_USD_RATE_SETTINGS,
}: {
  currency: MonthlyExpenseCurrency;
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
  rowCurrency: MonthlyExpenseCurrency;
  total: number;
  usdRate?: MonthlyExpenseUsdRateSettings;
}): number | null {
  if (!Number.isFinite(total)) {
    return null;
  }

  if (currency === rowCurrency) {
    return total;
  }

  const effectiveUsdRate = getUsdRateForRow({ exchangeRateSnapshot, usdRate });

  if (effectiveUsdRate == null) {
    return null;
  }

  return currency === "ARS"
    ? total * effectiveUsdRate
    : total / effectiveUsdRate;
}

/** Returns a row amount expressed in ARS for cross-currency comparison/sorting. */
export function getArsComparableAmount({
  exchangeRateSnapshot,
  rowCurrency,
  usdRate = DEFAULT_USD_RATE_SETTINGS,
  value,
}: {
  exchangeRateSnapshot: ExchangeRateSnapshot | null;
  rowCurrency: MonthlyExpenseCurrency;
  usdRate?: MonthlyExpenseUsdRateSettings;
  value: string;
}): number | null {
  return getConvertedAmountForCurrency({
    currency: "ARS",
    exchangeRateSnapshot,
    rowCurrency,
    total: Number(value),
    usdRate,
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
      exchangeRateSnapshot,
      rowCurrency: row.currency,
      total: Number(row.total),
      usdRate: row.usdRate,
    });

    if (convertedAmount == null) {
      continue;
    }

    total += convertedAmount;
    hasValues = true;
  }

  return hasValues ? total : null;
}
