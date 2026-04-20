import {
  createEmptyMonthlyExpensesDocument,
  createMonthlyExpensesDocument,
} from "@/modules/monthly-expenses/domain/value-objects/monthly-expenses-document";
import {
  expensesTable,
  monthlyExpenseMonthsTable,
} from "@/modules/shared/infrastructure/database/drizzle/schema";

import { DrizzleMonthlyExpensesRepository } from "./drizzle-monthly-expenses-repository";

describe("DrizzleMonthlyExpensesRepository", () => {
  it("persists monthly metadata and normalized rows in a single transaction", async () => {
    const selectWhereMock = jest.fn().mockResolvedValue([]);
    const selectFromMock = jest.fn().mockReturnValue({
      where: selectWhereMock,
    });
    const selectMock = jest.fn().mockReturnValue({
      from: selectFromMock,
    });
    const deleteWhereMock = jest.fn().mockResolvedValue(undefined);
    const deleteMock = jest.fn().mockReturnValue({
      where: deleteWhereMock,
    });
    const transactionExecutor = {
      delete: deleteMock,
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        }),
      }),
      select: selectMock,
    };
    const transactionMock = jest
      .fn()
      .mockImplementation(async (callback: (tx: unknown) => Promise<void>) =>
        callback(transactionExecutor),
      );
    const database = {
      transaction: transactionMock,
    };
    const repository = new DrizzleMonthlyExpensesRepository(
      database as never,
      "user-subject",
    );
    const document = createEmptyMonthlyExpensesDocument("2026-04");

    await repository.save(document);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(transactionExecutor.insert).toHaveBeenCalledWith(
      monthlyExpenseMonthsTable,
    );
    expect(transactionExecutor.insert).toHaveBeenCalledTimes(1);
  });

  it("stores incremental createdAt timestamps without overwriting conflicts", async () => {
    const insertedExpenseRows: { createdAtIso: string; expenseId: string }[] = [];
    const updatedExpenseRows: { expenseId: string; updatedFields: string[] }[] = [];
    const selectWhereMock = jest.fn().mockResolvedValue([]);
    const selectFromMock = jest.fn().mockReturnValue({
      where: selectWhereMock,
    });
    const selectMock = jest.fn().mockReturnValue({
      from: selectFromMock,
    });
    const deleteWhereMock = jest.fn().mockResolvedValue(undefined);
    const deleteMock = jest.fn().mockReturnValue({
      where: deleteWhereMock,
    });
    const insertMock = jest.fn((table: unknown) => ({
      values: jest.fn((payload: unknown) => {
        const isExpenseInsert =
          table === expensesTable &&
          payload &&
          typeof payload === "object" &&
          "createdAtIso" in payload &&
          "expenseId" in payload;

        if (
          isExpenseInsert
        ) {
          insertedExpenseRows.push(
            payload as { createdAtIso: string; expenseId: string },
          );
        }

        return {
          onConflictDoUpdate: jest.fn((conflictPayload: unknown) => {
            if (
              isExpenseInsert &&
              conflictPayload &&
              typeof conflictPayload === "object" &&
              "set" in conflictPayload &&
              conflictPayload.set &&
              typeof conflictPayload.set === "object"
            ) {
              updatedExpenseRows.push({
                expenseId: String((payload as { expenseId: string }).expenseId),
                updatedFields: Object.keys(
                  conflictPayload.set as Record<string, unknown>,
                ),
              });
            }

            return Promise.resolve(undefined);
          }),
        };
      }),
    }));
    const transactionExecutor = {
      delete: deleteMock,
      insert: insertMock,
      select: selectMock,
    };
    const transactionMock = jest
      .fn()
      .mockImplementation(async (callback: (tx: unknown) => Promise<void>) =>
        callback(transactionExecutor),
      );
    const database = {
      transaction: transactionMock,
    };
    const repository = new DrizzleMonthlyExpensesRepository(
      database as never,
      "user-subject",
    );
    const document = createMonthlyExpensesDocument(
      {
        items: [
          {
            currency: "ARS",
            description: "Expense Z",
            id: "z-id",
            occurrencesPerMonth: 1,
            subtotal: 10,
          },
          {
            currency: "ARS",
            description: "Expense A",
            id: "a-id",
            occurrencesPerMonth: 1,
            subtotal: 20,
          },
        ],
        month: "2026-04",
      },
      "Testing createdAt persistence order",
    );

    await repository.save(document);

    expect(insertedExpenseRows).toHaveLength(2);
    expect(insertedExpenseRows[0].expenseId).toBe("z-id");
    expect(insertedExpenseRows[1].expenseId).toBe("a-id");
    expect(insertedExpenseRows[0].createdAtIso).not.toBe(
      insertedExpenseRows[1].createdAtIso,
    );
    expect(insertedExpenseRows[0].createdAtIso < insertedExpenseRows[1].createdAtIso)
      .toBe(true);
    expect(updatedExpenseRows).toHaveLength(2);
    expect(updatedExpenseRows[0].expenseId).toBe("z-id");
    expect(updatedExpenseRows[1].expenseId).toBe("a-id");
    expect(updatedExpenseRows[0].updatedFields).not.toContain("createdAtIso");
    expect(updatedExpenseRows[1].updatedFields).not.toContain("createdAtIso");
  });

  it("orders normalized reads by created timestamp and expense id", async () => {
    const metadataLimitMock = jest.fn().mockResolvedValue([]);
    const metadataWhereMock = jest.fn().mockReturnValue({
      limit: metadataLimitMock,
    });
    const orderByMock = jest.fn().mockResolvedValue([]);
    const expensesWhereMock = jest.fn().mockReturnValue({
      orderBy: orderByMock,
    });
    const innerJoinMock = jest.fn().mockReturnValue({
      where: expensesWhereMock,
    });
    const fromMock = jest
      .fn()
      .mockReturnValueOnce({
        where: metadataWhereMock,
      })
      .mockReturnValueOnce({
        innerJoin: innerJoinMock,
      });
    const selectMock = jest.fn().mockReturnValue({
      from: fromMock,
    });
    const database = {
      select: selectMock,
    };
    const repository = new DrizzleMonthlyExpensesRepository(
      database as never,
      "user-subject",
    );

    await (repository as unknown as {
      getByMonthFromNormalized: (month: string) => Promise<unknown>;
    }).getByMonthFromNormalized("2026-04");

    expect(orderByMock).toHaveBeenCalledTimes(1);
    expect(orderByMock.mock.calls[0]).toHaveLength(2);
  });

  it("returns an empty document when monthly metadata exists without expense rows", async () => {
    const metadataLimitMock = jest.fn().mockResolvedValue([
      {
        exchangeRateBlueRate: 1200,
        exchangeRateMonth: "2026-04",
        exchangeRateOfficialRate: 1000,
        exchangeRateSolidarityRate: 1300,
        month: "2026-04",
      },
    ]);
    const metadataWhereMock = jest.fn().mockReturnValue({
      limit: metadataLimitMock,
    });
    const expensesOrderByMock = jest.fn().mockResolvedValue([]);
    const expensesWhereMock = jest.fn().mockReturnValue({
      orderBy: expensesOrderByMock,
    });
    const innerJoinMock = jest.fn().mockReturnValue({
      where: expensesWhereMock,
    });
    const fromMock = jest
      .fn()
      .mockReturnValueOnce({
        where: metadataWhereMock,
      })
      .mockReturnValueOnce({
        innerJoin: innerJoinMock,
      });
    const selectMock = jest.fn().mockReturnValue({
      from: fromMock,
    });
    const repository = new DrizzleMonthlyExpensesRepository(
      {
        select: selectMock,
      } as never,
      "user-subject",
    );

    const result = await (repository as unknown as {
      getByMonthFromNormalized: (
        month: string,
      ) => Promise<ReturnType<typeof createEmptyMonthlyExpensesDocument> | null>;
    }).getByMonthFromNormalized("2026-04");

    expect(result).toEqual(
      createMonthlyExpensesDocument(
        {
          exchangeRateSnapshot: {
            blueRate: 1200,
            month: "2026-04",
            officialRate: 1000,
            solidarityRate: 1300,
          },
          items: [],
          month: "2026-04",
        },
        "Testing empty monthly metadata reads",
      ),
    );
  });

  it("rejects duplicated expense ids before starting persistence", async () => {
    const transactionMock = jest.fn();
    const repository = new DrizzleMonthlyExpensesRepository(
      {
        transaction: transactionMock,
      } as never,
      "user-subject",
    );
    const duplicatedIdsDocument = createMonthlyExpensesDocument(
      {
        items: [
          {
            currency: "ARS",
            description: "Expense A",
            id: "duplicated-id",
            occurrencesPerMonth: 1,
            subtotal: 100,
          },
          {
            currency: "ARS",
            description: "Expense B",
            id: "duplicated-id",
            occurrencesPerMonth: 2,
            subtotal: 200,
          },
        ],
        month: "2026-04",
      },
      "Testing duplicated expense ids persistence",
    );

    await expect(repository.save(duplicatedIdsDocument)).rejects.toThrow(
      "Saving monthly expenses requires unique expense ids before persisting SQL rows.",
    );

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns normalized documents without checking the legacy JSON table", async () => {
    const repository = new DrizzleMonthlyExpensesRepository(
      {} as never,
      "user-subject",
    );
    const normalizedDocument = createMonthlyExpensesDocument(
      {
        items: [
          {
            currency: "ARS",
            description: "Single normalized item",
            id: "duplicated-id",
            occurrencesPerMonth: 1,
            subtotal: 100,
          },
        ],
        month: "2026-04",
      },
      "Testing normalized result",
    );
    jest.spyOn(
      repository as unknown as {
        getByMonthFromNormalized: (
          month: string,
        ) => Promise<typeof normalizedDocument>;
      },
      "getByMonthFromNormalized",
    ).mockResolvedValue(normalizedDocument);

    const result = await repository.getByMonth("2026-04");

    expect(result).toEqual(normalizedDocument);
  });
});
