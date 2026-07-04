import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  createRow,
  getTableTextOrder,
  renderMonthlyExpensesTable,
} from "./monthly-expenses-table-test-utils";

const FOLDERS = [
  { color: null, icon: null, id: "folder-home", name: "Hogar" },
  { color: null, icon: null, id: "folder-services", name: "Servicios" },
];

const ROWS = [
  createRow({
    description: "Compra suelta",
    expenseFolderId: "",
    id: "expense-1",
  }),
  createRow({
    description: "Luz",
    expenseFolderId: "folder-services",
    id: "expense-2",
  }),
  createRow({
    description: "Alquiler",
    expenseFolderId: "folder-home",
    id: "expense-3",
  }),
  createRow({
    description: "Internet",
    expenseFolderId: "folder-services",
    id: "expense-4",
  }),
];

async function selectGroupByFolder(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^Agrupar por/ }));
  await user.click(
    screen.getByRole("menuitemradio", { name: /Carpeta/ }),
  );
  await user.keyboard("{Escape}");
}

describe("MonthlyExpensesTable group by folder", () => {
  beforeEach(() => {
    // El sorting persiste en localStorage: sin limpiar, el restore asincrónico
    // de preferencias pisa el estado del test siguiente.
    window.localStorage.clear();
  });

  it("renders no group headers by default", () => {
    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    expect(
      screen.queryByLabelText("Grupo Hogar: 1 gasto"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Grupo Sin carpeta: 1 gasto"),
    ).not.toBeInTheDocument();
  });

  it("groups the rows under folder pill headers with their visible counts", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    await selectGroupByFolder(user);

    expect(
      await screen.findByLabelText("Grupo Hogar: 1 gasto"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Grupo Servicios: 2 gastos"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Grupo Sin carpeta: 1 gasto"),
    ).toBeInTheDocument();
    // El botón refleja la agrupación activa.
    expect(
      screen.getByRole("button", { name: "Agrupar por: Carpeta" }),
    ).toBeInTheDocument();

    // Dentro del <table>, los nombres de carpeta solo aparecen en los pills de
    // grupo (los chips de filtro viven fuera de la tabla).
    expect(
      getTableTextOrder([
        "Hogar",
        "Alquiler",
        "Servicios",
        "Luz",
        "Internet",
        "Sin carpeta",
        "Compra suelta",
      ]),
    ).toEqual([
      "Hogar",
      "Alquiler",
      "Servicios",
      "Luz",
      "Internet",
      "Sin carpeta",
      "Compra suelta",
    ]);
  });

  it("removes the group headers when going back to ungrouped", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    await selectGroupByFolder(user);

    expect(
      await screen.findByLabelText("Grupo Hogar: 1 gasto"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Agrupar por/ }));
    await user.click(
      screen.getByRole("menuitemradio", { name: "Sin agrupar" }),
    );
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByLabelText("Grupo Hogar: 1 gasto"),
      ).not.toBeInTheDocument();
    });
  });

  it("collapses and expands a group from its header like an accordion", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    await selectGroupByFolder(user);

    const servicesGroupHeader = await screen.findByRole("button", {
      name: "Grupo Servicios: 2 gastos",
    });

    expect(servicesGroupHeader).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Luz")).toBeInTheDocument();
    expect(screen.getByText("Internet")).toBeInTheDocument();

    await user.click(servicesGroupHeader);

    expect(servicesGroupHeader).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Luz")).not.toBeInTheDocument();
    expect(screen.queryByText("Internet")).not.toBeInTheDocument();
    // Los demás grupos no se ven afectados.
    expect(screen.getByText("Alquiler")).toBeInTheDocument();
    expect(screen.getByText("Compra suelta")).toBeInTheDocument();

    await user.click(servicesGroupHeader);

    expect(servicesGroupHeader).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Luz")).toBeInTheDocument();
    expect(screen.getByText("Internet")).toBeInTheDocument();
  });

  it("keeps the folder groups when sorting from a column header", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    await selectGroupByFolder(user);
    await screen.findByLabelText("Grupo Hogar: 1 gasto");

    await user.click(screen.getByRole("button", { name: "Ordenar Total" }));

    // Los grupos siguen intactos y el orden aplica adentro de cada uno.
    expect(
      screen.getByLabelText("Grupo Servicios: 2 gastos"),
    ).toBeInTheDocument();
    expect(
      getTableTextOrder(["Hogar", "Servicios", "Sin carpeta"]),
    ).toEqual(["Hogar", "Servicios", "Sin carpeta"]);
    // Y el menú «Ordenar por» queda sincronizado con el header.
    expect(
      screen.getByRole("button", { name: "Ordenar por: Total" }),
    ).toBeInTheDocument();
  });

  it("shows each group total with its paid/pending breakdown, also when collapsed", async () => {
    const user = userEvent.setup();

    renderMonthlyExpensesTable(
      [
        createRow({
          description: "Luz",
          expenseFolderId: "folder-services",
          id: "expense-1",
          manualCoveredPayments: "1",
          subtotal: "300",
          total: "300",
        }),
        createRow({
          description: "Internet",
          expenseFolderId: "folder-services",
          id: "expense-2",
          manualCoveredPayments: "0",
          subtotal: "200",
          total: "200",
        }),
      ],
      { expenseFolders: FOLDERS },
    );

    await selectGroupByFolder(user);

    const servicesGroupHeader = await screen.findByRole("button", {
      name: "Grupo Servicios: 2 gastos",
    });
    const normalizeSpaces = (text: string) => text.replace(/\s/g, " ");

    expect(normalizeSpaces(servicesGroupHeader.textContent ?? "")).toContain(
      "500,00",
    );
    expect(normalizeSpaces(servicesGroupHeader.textContent ?? "")).toContain(
      "Pagado: $ 300,00",
    );
    expect(normalizeSpaces(servicesGroupHeader.textContent ?? "")).toContain(
      "Pendiente: $ 200,00",
    );

    // Colapsado, el total sigue visible.
    await user.click(servicesGroupHeader);
    expect(servicesGroupHeader).toHaveAttribute("aria-expanded", "false");
    expect(normalizeSpaces(servicesGroupHeader.textContent ?? "")).toContain(
      "500,00",
    );
  });

  it("restores the grouping mode and collapsed groups from persisted preferences", async () => {
    const user = userEvent.setup();

    const { unmount } = renderMonthlyExpensesTable(ROWS, {
      expenseFolders: FOLDERS,
    });

    await selectGroupByFolder(user);

    const servicesGroupHeader = await screen.findByRole("button", {
      name: "Grupo Servicios: 2 gastos",
    });

    await user.click(servicesGroupHeader);
    expect(servicesGroupHeader).toHaveAttribute("aria-expanded", "false");

    unmount();
    renderMonthlyExpensesTable(ROWS, { expenseFolders: FOLDERS });

    // El agrupado vuelve activo y Servicios sigue colapsado.
    const restoredServicesGroupHeader = await screen.findByRole("button", {
      name: "Grupo Servicios: 2 gastos",
    });

    expect(restoredServicesGroupHeader).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Luz")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agrupar por: Carpeta" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alquiler")).toBeInTheDocument();
  });
});
