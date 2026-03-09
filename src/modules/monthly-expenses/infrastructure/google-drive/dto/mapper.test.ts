import {
  createMonthlyExpensesFileName,
  mapGoogleDriveMonthlyExpensesFileDtoToStoredDocument,
  mapMonthlyExpensesDocumentToGoogleDriveFile,
  parseGoogleDriveMonthlyExpensesContent,
} from "./mapper";

describe("monthlyExpensesGoogleDriveMapper", () => {
  it("serializes the monthly document into a Drive JSON file", () => {
    const result = mapMonthlyExpensesDocumentToGoogleDriveFile({
      items: [
        {
          currency: "ARS",
          description: "Expensas",
          id: "expense-1",
          occurrencesPerMonth: 1,
          subtotal: 55032.07,
          total: 55032.07,
        },
      ],
      month: "2026-03",
    });

    expect(result).toEqual({
      content: JSON.stringify(
        {
          items: [
            {
              currency: "ARS",
              description: "Expensas",
              id: "expense-1",
              occurrencesPerMonth: 1,
              subtotal: 55032.07,
            },
          ],
          month: "2026-03",
        },
        null,
        2,
      ),
      mimeType: "application/json",
      name: "gastos-mensuales-2026-marzo.json",
    });
    expect(createMonthlyExpensesFileName("2026-03")).toBe(
      "gastos-mensuales-2026-marzo.json",
    );
  });

  it("serializes loan metadata without derived fields", () => {
    const result = mapMonthlyExpensesDocumentToGoogleDriveFile({
      items: [
        {
          currency: "ARS",
          description: "Prestamo familiar",
          id: "expense-1",
          loan: {
            endMonth: "2026-12",
            installmentCount: 12,
            lenderName: "Papa",
            paidInstallments: 3,
            startMonth: "2026-01",
          },
          occurrencesPerMonth: 1,
          subtotal: 50000,
          total: 50000,
        },
      ],
      month: "2026-03",
    });

    expect(result.content).toBe(
      JSON.stringify(
        {
          items: [
            {
              currency: "ARS",
              description: "Prestamo familiar",
              id: "expense-1",
              loan: {
                installmentCount: 12,
                lenderName: "Papa",
                startMonth: "2026-01",
              },
              occurrencesPerMonth: 1,
              subtotal: 50000,
            },
          ],
          month: "2026-03",
        },
        null,
        2,
      ),
    );
  });

  it("parses stored Drive content into the internal monthly document", () => {
    const result = parseGoogleDriveMonthlyExpensesContent(
      JSON.stringify({
        items: [
          {
            currency: "USD",
            description: "Google One",
            id: "expense-1",
            occurrencesPerMonth: 1,
            subtotal: 2.49,
          },
        ],
        month: "2026-03",
      }),
      "Loading monthly expenses",
    );

    expect(result).toEqual({
      items: [
        {
          currency: "USD",
          description: "Google One",
          id: "expense-1",
          occurrencesPerMonth: 1,
          subtotal: 2.49,
          total: 2.49,
        },
      ],
      month: "2026-03",
    });
  });

  it("parses stored loan metadata and derives the payment progress", () => {
    const result = parseGoogleDriveMonthlyExpensesContent(
      JSON.stringify({
        items: [
          {
            currency: "ARS",
            description: "Prestamo tarjeta",
            id: "expense-1",
            loan: {
              installmentCount: 12,
              lenderName: "Papa",
              startMonth: "2026-01",
            },
            occurrencesPerMonth: 1,
            subtotal: 50000,
          },
        ],
        month: "2026-03",
      }),
      "Loading monthly expenses",
    );

    expect(result).toEqual({
      items: [
        {
          currency: "ARS",
          description: "Prestamo tarjeta",
          id: "expense-1",
          loan: {
            endMonth: "2026-12",
            installmentCount: 12,
            lenderName: "Papa",
            paidInstallments: 3,
            startMonth: "2026-01",
          },
          occurrencesPerMonth: 1,
          subtotal: 50000,
          total: 50000,
        },
      ],
      month: "2026-03",
    });
  });

  it("maps file metadata into the stored document result", () => {
    expect(
      mapGoogleDriveMonthlyExpensesFileDtoToStoredDocument(
        {
          id: "monthly-expenses-file-id",
          name: "gastos-mensuales-2026-marzo.json",
          webViewLink:
            "https://drive.google.com/file/d/monthly-expenses-file-id/view",
        },
        "2026-03",
      ),
    ).toEqual({
      id: "monthly-expenses-file-id",
      month: "2026-03",
      name: "gastos-mensuales-2026-marzo.json",
      viewUrl: "https://drive.google.com/file/d/monthly-expenses-file-id/view",
    });
  });
});
