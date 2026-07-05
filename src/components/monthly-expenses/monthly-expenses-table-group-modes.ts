import type { ExpenseFolderOption } from "./expense-folder-picker";
import { isPaymentCompleted } from "./monthly-expenses-payment-progress";
import type {
  MonthlyExpensesEditableRow,
  MonthlyExpensesGroupByMode,
} from "./monthly-expenses-table.types";

/** Modo de agrupado activo (todo menos "none"). */
export type ActiveMonthlyExpensesGroupByMode = Exclude<
  MonthlyExpensesGroupByMode,
  "none"
>;

/** Etiqueta humana de cada modo de agrupado (menú y botón «Agrupar por»). */
export const GROUP_BY_MODE_LABELS: Record<
  ActiveMonthlyExpensesGroupByMode,
  string
> = {
  currency: "Moneda",
  direction: "Dirección",
  folder: "Carpeta",
  lender: "Contraparte",
  paymentStatus: "Estado de pago",
};

/** Opciones del menú «Agrupar por», en el orden en que se listan. */
export const GROUP_BY_MODE_MENU_OPTIONS: Array<{
  label: string;
  value: ActiveMonthlyExpensesGroupByMode;
}> = [
  { label: GROUP_BY_MODE_LABELS.folder, value: "folder" },
  { label: GROUP_BY_MODE_LABELS.lender, value: "lender" },
  { label: GROUP_BY_MODE_LABELS.currency, value: "currency" },
  { label: GROUP_BY_MODE_LABELS.direction, value: "direction" },
  { label: GROUP_BY_MODE_LABELS.paymentStatus, value: "paymentStatus" },
];

/** Etiquetas de los grupos sin valor propio, por modo. */
export const UNASSIGNED_FOLDER_GROUP_LABEL = "Sin carpeta";
const UNASSIGNED_LENDER_GROUP_LABEL = "Sin contraparte";
const NO_LOAN_GROUP_LABEL = "Sin deuda";

/** Contexto de lookup que necesitan las claves/etiquetas/posiciones de grupo. */
export interface MonthlyExpensesGroupModeContext {
  foldersById: Map<string, ExpenseFolderOption>;
  lenderNamesById: Map<string, string>;
}

/**
 * Clave de grupo de una fila para el modo dado. Cadena vacía identifica al
 * grupo "sin valor" (sin carpeta / sin contraparte / sin deuda).
 */
export function getGroupKeyForMode(
  mode: ActiveMonthlyExpensesGroupByMode,
  row: MonthlyExpensesEditableRow,
  context: MonthlyExpensesGroupModeContext,
): string {
  switch (mode) {
    case "folder":
      return row.expenseFolderId && context.foldersById.has(row.expenseFolderId)
        ? row.expenseFolderId
        : "";
    case "lender":
      return row.lenderId && context.lenderNamesById.has(row.lenderId)
        ? row.lenderId
        : "";
    case "currency":
      return row.currency;
    case "direction":
      return row.isLoan ? row.loanDirection ?? "payable" : "";
    case "paymentStatus":
      return isPaymentCompleted(row) ? "completed" : "pending";
  }
}

/** Etiqueta visible del grupo identificado por `groupKey` en el modo dado. */
export function getGroupLabelForMode(
  mode: ActiveMonthlyExpensesGroupByMode,
  groupKey: string,
  context: MonthlyExpensesGroupModeContext,
): string {
  switch (mode) {
    case "folder":
      return groupKey
        ? context.foldersById.get(groupKey)?.name ??
            UNASSIGNED_FOLDER_GROUP_LABEL
        : UNASSIGNED_FOLDER_GROUP_LABEL;
    case "lender":
      return groupKey
        ? context.lenderNamesById.get(groupKey) ?? UNASSIGNED_LENDER_GROUP_LABEL
        : UNASSIGNED_LENDER_GROUP_LABEL;
    case "currency":
      return groupKey;
    case "direction":
      if (groupKey === "payable") {
        return "Yo debo";
      }

      return groupKey === "receivable" ? "Me deben" : NO_LOAN_GROUP_LABEL;
    case "paymentStatus":
      return groupKey === "completed" ? "Pagado" : "Pendiente";
  }
}

/** Sentinel que ordena los grupos "sin valor" al final (tras cualquier nombre). */
const LAST_GROUP_POSITION_SENTINEL = "￿";

/**
 * Valor de orden de la fila para la columna fantasma de posición de grupo
 * (`sortingFn: "basic"`). Comparable de forma consistente dentro de un mismo
 * modo: números para modos con orden fijo, strings para los alfabéticos.
 */
export function getGroupPositionForMode(
  mode: ActiveMonthlyExpensesGroupByMode,
  row: MonthlyExpensesEditableRow,
  context: MonthlyExpensesGroupModeContext & {
    folderPositionById: Map<string, number>;
  },
): number | string {
  switch (mode) {
    case "folder":
      return (
        context.folderPositionById.get(row.expenseFolderId) ??
        context.folderPositionById.size
      );
    case "lender": {
      const lenderName = row.lenderId
        ? context.lenderNamesById.get(row.lenderId)
        : undefined;

      return lenderName
        ? lenderName.toLocaleLowerCase("es")
        : LAST_GROUP_POSITION_SENTINEL;
    }
    case "currency":
      // ARS antes que USD (orden alfabético natural de ambas monedas).
      return row.currency;
    case "direction": {
      if (!row.isLoan) {
        return 2;
      }

      return row.loanDirection === "receivable" ? 1 : 0;
    }
    case "paymentStatus":
      return isPaymentCompleted(row) ? 1 : 0;
  }
}
