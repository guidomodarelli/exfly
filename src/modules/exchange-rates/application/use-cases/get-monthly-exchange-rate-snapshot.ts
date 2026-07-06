import type { MonthlyExchangeRateSnapshot } from "../../domain/entities/monthly-exchange-rate-snapshot";
import type { ExchangeRatesRepository } from "../../domain/repositories/exchange-rates-repository";
import type { MonthlyExchangeRateSnapshotsRepository } from "../../domain/repositories/monthly-exchange-rate-snapshots-repository";

export const DEFAULT_IIBB_RATE_DECIMAL = 0.02;
export const SOLIDARITY_RATE_IVA_DECIMAL = 0.21;
const AMBITO_HISTORICAL_SOURCE = "ambito-historico-general";

export function calculateSolidarityRate(
  officialRate: number,
  iibbRateDecimal: number,
): number {
  return officialRate * (1 + iibbRateDecimal + SOLIDARITY_RATE_IVA_DECIMAL);
}

function createSnapshotFromRates({
  blueRate,
  iibbRateDecimalUsed,
  month,
  now,
  officialRate,
  sourceDateIso,
}: {
  blueRate: number;
  iibbRateDecimalUsed: number;
  month: string;
  now: Date;
  officialRate: number;
  sourceDateIso: string;
}): MonthlyExchangeRateSnapshot {
  return {
    blueRate,
    iibbRateDecimalUsed,
    month,
    officialRate,
    solidarityRate: calculateSolidarityRate(officialRate, iibbRateDecimalUsed),
    source: AMBITO_HISTORICAL_SOURCE,
    sourceDateIso,
    updatedAtIso: now.toISOString(),
  };
}

export async function getMonthlyExchangeRateSnapshot({
  exchangeRatesRepository,
  month,
  monthlyExchangeRateSnapshotsRepository,
  now = () => new Date(),
}: {
  exchangeRatesRepository: ExchangeRatesRepository;
  month: string;
  monthlyExchangeRateSnapshotsRepository: MonthlyExchangeRateSnapshotsRepository;
  now?: () => Date;
}): Promise<MonthlyExchangeRateSnapshot> {
  const cachedSnapshot =
    await monthlyExchangeRateSnapshotsRepository.getByMonth(month);

  // The cached snapshot is the source of truth for the month's IIBB. It is
  // edited per month through `saveMonthlyIibbRate`, so it is returned untouched
  // here instead of being overwritten by any global default.
  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  const [officialRate, blueRate] = await Promise.all([
    exchangeRatesRepository.getMonthlyRate({
      month,
      variant: "official",
    }),
    exchangeRatesRepository.getMonthlyRate({
      month,
      variant: "blue",
    }),
  ]);

  return monthlyExchangeRateSnapshotsRepository.save(
    createSnapshotFromRates({
      blueRate: blueRate.rate,
      iibbRateDecimalUsed: DEFAULT_IIBB_RATE_DECIMAL,
      month,
      now: now(),
      officialRate: officialRate.rate,
      sourceDateIso:
        officialRate.sourceDateIso >= blueRate.sourceDateIso
          ? officialRate.sourceDateIso
          : blueRate.sourceDateIso,
    }),
  );
}
