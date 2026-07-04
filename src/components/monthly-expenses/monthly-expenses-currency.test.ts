import {
  getConvertedAmountForCurrency,
  getUsdRateForRow,
} from "./monthly-expenses-currency";
import type { ExchangeRateSnapshot } from "./monthly-expenses-table.types";

const SNAPSHOT: ExchangeRateSnapshot = {
  blueRate: 1500,
  month: "2026-07",
  officialRate: 1000,
  solidarityRate: 1300,
};

describe("getUsdRateForRow", () => {
  it("resolves each rate type against the snapshot", () => {
    expect(
      getUsdRateForRow({
        customUsdRate: null,
        exchangeRateSnapshot: SNAPSHOT,
        usdRateType: "blue",
      }),
    ).toBe(1500);
    expect(
      getUsdRateForRow({
        customUsdRate: null,
        exchangeRateSnapshot: SNAPSHOT,
        usdRateType: "officialWithIibb",
      }),
    ).toBe(1300);
    expect(
      getUsdRateForRow({
        customUsdRate: null,
        exchangeRateSnapshot: SNAPSHOT,
        usdRateType: "official",
      }),
    ).toBe(1000);
  });

  it("uses the manual rate for the custom type even without a snapshot", () => {
    expect(
      getUsdRateForRow({
        customUsdRate: 1480.5,
        exchangeRateSnapshot: null,
        usdRateType: "custom",
      }),
    ).toBe(1480.5);
  });

  it("returns null when the snapshot is missing or the custom rate is invalid", () => {
    expect(
      getUsdRateForRow({
        customUsdRate: null,
        exchangeRateSnapshot: null,
        usdRateType: "blue",
      }),
    ).toBeNull();
    expect(
      getUsdRateForRow({
        customUsdRate: 0,
        exchangeRateSnapshot: SNAPSHOT,
        usdRateType: "custom",
      }),
    ).toBeNull();
  });
});

describe("getConvertedAmountForCurrency", () => {
  it("converts USD to ARS with the per-row rate type", () => {
    expect(
      getConvertedAmountForCurrency({
        currency: "ARS",
        exchangeRateSnapshot: SNAPSHOT,
        rowCurrency: "USD",
        total: 10,
        usdRateType: "blue",
      }),
    ).toBe(15000);
  });

  it("keeps the solidarity rate as the default when no rate type is given", () => {
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
        customUsdRate: 2000,
        exchangeRateSnapshot: SNAPSHOT,
        rowCurrency: "ARS",
        total: 4000,
        usdRateType: "custom",
      }),
    ).toBe(2);
  });
});
