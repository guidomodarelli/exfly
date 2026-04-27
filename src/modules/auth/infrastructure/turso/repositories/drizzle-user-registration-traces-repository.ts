import { eq } from "drizzle-orm";

import { userRegistrationTracesTable } from "@/modules/shared/infrastructure/database/drizzle/schema";
import type { TursoDatabase } from "@/modules/shared/infrastructure/database/drizzle/turso-database";

export type UserRegistrationTrace = {
  authProvider: string;
  lastVerifiedAtIso: string;
  registeredAtIso: string;
  registrationEmail: string;
  userSubject: string;
};

export class DrizzleUserRegistrationTracesRepository {
  constructor(private readonly database: TursoDatabase) {}

  async getRegistrationTraceByUserSubject(
    userSubject: string,
  ): Promise<UserRegistrationTrace | null> {
    const rows = await this.database
      .select({
        authProvider: userRegistrationTracesTable.authProvider,
        lastVerifiedAtIso: userRegistrationTracesTable.lastVerifiedAtIso,
        registeredAtIso: userRegistrationTracesTable.registeredAtIso,
        registrationEmail: userRegistrationTracesTable.registrationEmail,
        userSubject: userRegistrationTracesTable.userSubject,
      })
      .from(userRegistrationTracesTable)
      .where(eq(userRegistrationTracesTable.userSubject, userSubject))
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertRegistrationTrace({
    authProvider,
    nowIso,
    registrationEmail,
    userSubject,
  }: {
    authProvider: string;
    nowIso: string;
    registrationEmail: string;
    userSubject: string;
  }): Promise<void> {
    await this.database
      .insert(userRegistrationTracesTable)
      .values({
        authProvider,
        lastVerifiedAtIso: nowIso,
        registeredAtIso: nowIso,
        registrationEmail,
        userSubject,
      })
      .onConflictDoUpdate({
        set: {
          authProvider,
          lastVerifiedAtIso: nowIso,
          registrationEmail,
        },
        target: [userRegistrationTracesTable.userSubject],
      });
  }
}
