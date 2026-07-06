import { getAuthenticatedUserSubjectFromRequest } from "@/modules/auth/infrastructure/next-auth/authenticated-user-subject";
import { saveMonthlyIibbRate } from "@/modules/exchange-rates/application/use-cases/save-monthly-iibb-rate";
import { calculateSolidarityRate } from "@/modules/exchange-rates/application/use-cases/get-monthly-exchange-rate-snapshot";
import { AmbitoExchangeRatesRepository } from "@/modules/exchange-rates/infrastructure/api/ambito-exchange-rates-repository";
import { createMonthlyIibbRateApiHandler } from "@/modules/exchange-rates/infrastructure/api/create-monthly-iibb-rate-api-handler";
import { DrizzleMonthlyExchangeRateSnapshotsRepository } from "@/modules/exchange-rates/infrastructure/turso/repositories/drizzle-monthly-exchange-rate-snapshots-repository";
import { DrizzleMonthlyExpensesRepository } from "@/modules/monthly-expenses/infrastructure/turso/repositories/drizzle-monthly-expenses-repository";
import { createAppRouteHandler } from "@/modules/shared/infrastructure/next-app/next-api-handler-adapter";

const handler = createAppRouteHandler(
  createMonthlyIibbRateApiHandler({
    save: async ({ command, database, request }) => {
      const result = await saveMonthlyIibbRate({
        command,
        exchangeRatesRepository: new AmbitoExchangeRatesRepository(),
        monthlyExchangeRateSnapshotsRepository:
          new DrizzleMonthlyExchangeRateSnapshotsRepository(database),
      });

      // Rewrite the frozen solidario of already-stored documents for this month
      // so they reflect the new IIBB. The solidario formula stays in the
      // exchange-rates module: multiplier = 1 + IIBB + IVA.
      const userSubject = await getAuthenticatedUserSubjectFromRequest(request);
      const expensesRepository = new DrizzleMonthlyExpensesRepository(
        database,
        userSubject,
      );

      await expensesRepository.refreshExchangeRateSolidarityForMonth?.({
        month: result.month,
        solidarityMultiplier: calculateSolidarityRate(1, result.iibbRateDecimal),
      });

      return result;
    },
  }),
);

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
