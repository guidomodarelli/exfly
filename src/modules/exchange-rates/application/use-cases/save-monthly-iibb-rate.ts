import { createIibbRateDecimal } from "../../domain/value-objects/iibb-rate-decimal";
import type { ExchangeRatesRepository } from "../../domain/repositories/exchange-rates-repository";
import type { MonthlyExchangeRateSnapshotsRepository } from "../../domain/repositories/monthly-exchange-rate-snapshots-repository";

import type { SaveMonthlyIibbRateCommand } from "../commands/save-monthly-iibb-rate-command";
import type { MonthlyIibbRateResult } from "../results/monthly-iibb-rate-result";
import {
  calculateSolidarityRate,
  getMonthlyExchangeRateSnapshot,
} from "./get-monthly-exchange-rate-snapshot";

/**
 * Persists the IIBB perception for a single month. The month snapshot is the
 * source of truth per month, so this loads (or seeds from Ambito on a miss) the
 * month snapshot, applies the validated IIBB, recomputes the solidario, and
 * saves it back. Refreshing already-frozen expense documents is orchestrated by
 * the composition root, not here, to keep this use case free of monthly-expenses
 * dependencies.
 */
export async function saveMonthlyIibbRate({
  command,
  exchangeRatesRepository,
  monthlyExchangeRateSnapshotsRepository,
  now = () => new Date(),
}: {
  command: SaveMonthlyIibbRateCommand;
  exchangeRatesRepository: ExchangeRatesRepository;
  monthlyExchangeRateSnapshotsRepository: MonthlyExchangeRateSnapshotsRepository;
  now?: () => Date;
}): Promise<MonthlyIibbRateResult> {
  const iibbRateDecimal = createIibbRateDecimal(
    command.iibbRateDecimal,
    "Saving the monthly IIBB rate",
  );
  const snapshot = await getMonthlyExchangeRateSnapshot({
    exchangeRatesRepository,
    month: command.month,
    monthlyExchangeRateSnapshotsRepository,
    now,
  });
  const updatedSnapshot = await monthlyExchangeRateSnapshotsRepository.save({
    ...snapshot,
    iibbRateDecimalUsed: iibbRateDecimal,
    solidarityRate: calculateSolidarityRate(
      snapshot.officialRate,
      iibbRateDecimal,
    ),
    updatedAtIso: now().toISOString(),
  });

  return {
    iibbRateDecimal: updatedSnapshot.iibbRateDecimalUsed,
    month: updatedSnapshot.month,
    solidarityRate: updatedSnapshot.solidarityRate,
  };
}
