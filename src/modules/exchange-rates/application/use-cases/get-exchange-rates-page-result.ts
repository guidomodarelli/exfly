import type { ExchangeRatesRepository } from "../../domain/repositories/exchange-rates-repository";
import type { MonthlyExchangeRateSnapshotsRepository } from "../../domain/repositories/monthly-exchange-rate-snapshots-repository";

import type { ExchangeRatesPageResult } from "../results/exchange-rates-page-result";
import { getMonthlyExchangeRateSnapshot } from "./get-monthly-exchange-rate-snapshot";

export async function getExchangeRatesPageResult({
  canEditIibb,
  exchangeRatesRepository,
  maxSelectableMonth,
  minSelectableMonth,
  month,
  monthlyExchangeRateSnapshotsRepository,
}: {
  canEditIibb: boolean;
  exchangeRatesRepository: ExchangeRatesRepository;
  maxSelectableMonth: string;
  minSelectableMonth: string;
  month: string;
  monthlyExchangeRateSnapshotsRepository: MonthlyExchangeRateSnapshotsRepository;
}): Promise<ExchangeRatesPageResult> {
  const snapshot = await getMonthlyExchangeRateSnapshot({
    exchangeRatesRepository,
    month,
    monthlyExchangeRateSnapshotsRepository,
  });

  return {
    blueRate: snapshot.blueRate,
    canEditIibb,
    iibbRateDecimal: snapshot.iibbRateDecimalUsed,
    loadErrorCode: null,
    loadError: null,
    maxSelectableMonth,
    minSelectableMonth,
    officialRate: snapshot.officialRate,
    selectedMonth: snapshot.month,
    solidarityRate: snapshot.solidarityRate,
  };
}
