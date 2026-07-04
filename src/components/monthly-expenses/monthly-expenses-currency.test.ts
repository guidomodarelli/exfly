import {
  getConvertedAmountForCurrency,
  getUsdRateForRow,
} from "./monthly-expenses-currency";
import type {
  ExchangeRateSnapshot,
  MonthlyExpenseUsdRateSettings,
} from "./monthly-expenses-table.types";

const SNAPSHOT: ExchangeRateSnapshot = {
  blueRate: 1500,
  month: "2026-07",
  officialRate: 1000,
  solidarityRate: 1300,
};

function buildUsdRate(
  overrides: Partial<MonthlyExpenseUsdRateSettings> = {},
): MonthlyExpenseUsdRateSettings {
  return {
    appliesIibb: false,
    appliesIva: false,
    base: "official",
    customRate: null,
    ...overrides,
  };
}

describe("getUsdRateForRow", () => {
  it("resolves each base against the snapshot", () => {
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({ base: "blue" }),
      }),
    ).toBe(1500);
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({ base: "official" }),
      }),
    ).toBe(1000);
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({ base: "custom", customRate: 1480.5 }),
      }),
    ).toBe(1480.5);
  });

  it("adds the IIBB perception derived from the snapshot", () => {
    // Factor IIBB = solidario / oficial = 1300 / 1000 = 1.3.
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({ appliesIibb: true, base: "official" }),
      }),
    ).toBe(1300);
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({ appliesIibb: true, base: "blue" }),
      }),
    ).toBeCloseTo(1950);
  });

  it("adds the 21% VAT surcharge on top of the base and IIBB", () => {
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({ appliesIva: true, base: "official" }),
      }),
    ).toBeCloseTo(1210);
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({
          appliesIibb: true,
          appliesIva: true,
          base: "official",
        }),
      }),
    ).toBeCloseTo(1573);
  });

  it("supports surcharges over a custom base without needing the base quotes", () => {
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({
          appliesIva: true,
          base: "custom",
          customRate: 1000,
        }),
      }),
    ).toBeCloseTo(1210);
  });

  it("returns null when a needed snapshot is missing or the custom rate is invalid", () => {
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: null,
        usdRate: buildUsdRate({ base: "blue" }),
      }),
    ).toBeNull();
    // Un custom sin IIBB no necesita snapshot…
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: null,
        usdRate: buildUsdRate({ base: "custom", customRate: 2000 }),
      }),
    ).toBe(2000);
    // …pero con IIBB sí (el factor sale del snapshot).
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: null,
        usdRate: buildUsdRate({
          appliesIibb: true,
          base: "custom",
          customRate: 2000,
        }),
      }),
    ).toBeNull();
    expect(
      getUsdRateForRow({
        exchangeRateSnapshot: SNAPSHOT,
        usdRate: buildUsdRate({ base: "custom", customRate: 0 }),
      }),
    ).toBeNull();
  });
});

describe("getConvertedAmountForCurrency", () => {
  it("converts USD to ARS with the per-row settings", () => {
    expect(
      getConvertedAmountForCurrency({
        currency: "ARS",
        exchangeRateSnapshot: SNAPSHOT,
        rowCurrency: "USD",
        total: 10,
        usdRate: buildUsdRate({ base: "blue" }),
      }),
    ).toBe(15000);
  });

  it("keeps official + IIBB (solidario) as the default when no settings are given", () => {
    expect(
      getConvertedAmountForCurrency({
        currency: "ARS",
        exchangeRateSnapshot: SNAPSHOT,
        rowCurrency: "USD",
        total: 10,
      }),
    ).toBe(13000);
  });

  it("converts ARS to USD dividing by the per-row rate", () => {
    expect(
      getConvertedAmountForCurrency({
        currency: "USD",
        exchangeRateSnapshot: SNAPSHOT,
        rowCurrency: "ARS",
        total: 4000,
        usdRate: buildUsdRate({ base: "custom", customRate: 2000 }),
      }),
    ).toBe(2);
  });
});
