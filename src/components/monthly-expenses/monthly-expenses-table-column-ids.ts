/**
 * Stable column identifiers shared across the monthly expenses table, its
 * sorting helpers, and the persisted-preferences validation. Kept in one place
 * so the id strings have a single source of truth.
 */

export const LOAN_SORT_COLUMN_ID = "loanProgress";

export const LOAN_INSTALLMENT_RANGE_COLUMN_ID = "loanInstallmentRange";

export const BULK_SELECTION_COLUMN_ID = "bulkSelection";

/**
 * Columna oculta que ancla el agrupado por carpeta: siempre invisible, solo
 * existe para que TanStack ordene primero por posición de grupo y cualquier
 * orden de usuario (header o menú «Ordenar por») aplique dentro de cada grupo.
 */
export const GROUP_POSITION_COLUMN_ID = "groupPosition";
