import type { TursoDatabase } from "@/modules/shared/infrastructure/database/drizzle/turso-database";

import { getMonthlyExchangeRateSnapshot } from "../application/use-cases/get-monthly-exchange-rate-snapshot";
import { AmbitoExchangeRatesRepository } from "./api/ambito-exchange-rates-repository";
import { DrizzleMonthlyExchangeRateSnapshotsRepository } from "./turso/repositories/drizzle-monthly-exchange-rate-snapshots-repository";

export function createGetMonthlyExchangeRateSnapshot(database: TursoDatabase) {
  const exchangeRatesRepository = new AmbitoExchangeRatesRepository();
  const monthlyExchangeRateSnapshotsRepository =
    new DrizzleMonthlyExchangeRateSnapshotsRepository(database);

  return (month: string) =>
    getMonthlyExchangeRateSnapshot({
      exchangeRatesRepository,
      month,
      monthlyExchangeRateSnapshotsRepository,
    });
}
