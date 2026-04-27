import { userRegistrationTracesTable } from "@/modules/shared/infrastructure/database/drizzle/schema";

import { DrizzleUserRegistrationTracesRepository } from "./drizzle-user-registration-traces-repository";

describe("DrizzleUserRegistrationTracesRepository", () => {
  it("returns null when traceability record does not exist", async () => {
    const whereMock = jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue([]),
    });
    const fromMock = jest.fn().mockReturnValue({
      where: whereMock,
    });
    const selectMock = jest.fn().mockReturnValue({
      from: fromMock,
    });
    const repository = new DrizzleUserRegistrationTracesRepository({
      select: selectMock,
    } as never);

    const result = await repository.getRegistrationTraceByUserSubject(
      "google-user-123",
    );

    expect(result).toBeNull();
  });

  it("maps an existing SQL row into traceability payload", async () => {
    const whereMock = jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue([
        {
          authProvider: "google",
          lastVerifiedAtIso: "2026-04-27T10:00:00.000Z",
          registeredAtIso: "2026-04-20T10:00:00.000Z",
          registrationEmail: "user@example.com",
          userSubject: "google-user-123",
        },
      ]),
    });
    const fromMock = jest.fn().mockReturnValue({
      where: whereMock,
    });
    const selectMock = jest.fn().mockReturnValue({
      from: fromMock,
    });
    const repository = new DrizzleUserRegistrationTracesRepository({
      select: selectMock,
    } as never);

    const result = await repository.getRegistrationTraceByUserSubject(
      "google-user-123",
    );

    expect(result).toEqual({
      authProvider: "google",
      lastVerifiedAtIso: "2026-04-27T10:00:00.000Z",
      registeredAtIso: "2026-04-20T10:00:00.000Z",
      registrationEmail: "user@example.com",
      userSubject: "google-user-123",
    });
  });

  it("upserts and updates verification timestamp while preserving registration timestamp", async () => {
    const onConflictDoUpdateMock = jest.fn().mockResolvedValue(undefined);
    const valuesMock = jest.fn().mockReturnValue({
      onConflictDoUpdate: onConflictDoUpdateMock,
    });
    const insertMock = jest.fn().mockReturnValue({
      values: valuesMock,
    });
    const repository = new DrizzleUserRegistrationTracesRepository({
      insert: insertMock,
    } as never);

    await repository.upsertRegistrationTrace({
      authProvider: "google",
      nowIso: "2026-04-27T11:00:00.000Z",
      registrationEmail: "user@example.com",
      userSubject: "google-user-123",
    });

    expect(insertMock).toHaveBeenCalledWith(userRegistrationTracesTable);
    expect(valuesMock).toHaveBeenCalledWith({
      authProvider: "google",
      lastVerifiedAtIso: "2026-04-27T11:00:00.000Z",
      registeredAtIso: "2026-04-27T11:00:00.000Z",
      registrationEmail: "user@example.com",
      userSubject: "google-user-123",
    });
    expect(onConflictDoUpdateMock).toHaveBeenCalledWith({
      set: {
        authProvider: "google",
        lastVerifiedAtIso: "2026-04-27T11:00:00.000Z",
        registrationEmail: "user@example.com",
      },
      target: [userRegistrationTracesTable.userSubject],
    });
  });
});
