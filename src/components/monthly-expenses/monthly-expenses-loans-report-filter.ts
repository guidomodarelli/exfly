import {
  normalizeFilterSlug,
  type AppliedFilter,
  type FilterQualifierConfig,
  type FilterQualifierOption,
  type ParsedFilterQuery,
} from "@/components/ui/filter-query-grammar";

import { buildLenderQualifierOptions } from "./monthly-expenses-filter-qualifiers";

/** Clave de orden del listado de deudas, elegida vía `orden:` en la barra. */
export type LoansReportSortKey = "amount" | "due" | "lender";

export const DEFAULT_LOANS_REPORT_SORT_KEY: LoansReportSortKey = "amount";

/** Etiqueta del qualifier de texto libre (fuzzy sobre el nombre del prestamista). */
export const LOANS_REPORT_TEXT_QUALIFIER_LABEL = "Prestamista";

const LENDER_TYPE_QUALIFIER_OPTIONS: FilterQualifierOption[] = [
  { label: "Bancos", slug: "banco", value: "bank" },
  { label: "Familiares", slug: "familiar", value: "family" },
  { label: "Amigos", slug: "amigo", value: "friend" },
  { label: "Otros", slug: "otro", value: "other" },
  { label: "Sin prestamista", slug: "sin-prestamista", value: "unassigned" },
];

const SORT_QUALIFIER_OPTIONS: FilterQualifierOption[] = [
  { label: "Monto", slug: "monto", value: "amount" },
  { label: "Vencimiento", slug: "vencimiento", value: "due" },
  { label: "Prestamista", slug: "prestamista", value: "lender" },
];

/** Clave del qualifier de orden; no filtra, elige el criterio de orden. */
export const LOANS_REPORT_SORT_QUALIFIER_KEY = "orden";

export interface LoansReportLenderFilterOption {
  id: string;
  label: string;
}

/**
 * Qualifiers de la barra unificada del reporte de deudas: texto libre por
 * nombre de prestamista, `tipo:`, `prestamista:` (una opción por prestamista
 * con deuda) y `orden:` para el criterio de orden del listado.
 */
export function buildLoansReportFilterQualifiers(
  lenderOptions: LoansReportLenderFilterOption[],
): FilterQualifierConfig[] {
  return [
    { key: "", kind: "text", label: LOANS_REPORT_TEXT_QUALIFIER_LABEL },
    {
      key: "tipo",
      kind: "enum",
      label: "Tipo",
      options: LENDER_TYPE_QUALIFIER_OPTIONS,
    },
    lenderOptions.length > 0
      ? {
          iconName: "user",
          key: "prestamista",
          kind: "enum",
          label: "Prestamista",
          options: buildLenderQualifierOptions(
            lenderOptions.map((option) => ({
              id: option.id,
              name: option.label,
            })),
          ),
        }
      : { iconName: "user", key: "prestamista", kind: "textMatch", label: "Prestamista" },
    {
      key: LOANS_REPORT_SORT_QUALIFIER_KEY,
      kind: "enum",
      label: "Ordenar por",
      options: SORT_QUALIFIER_OPTIONS,
    },
  ];
}

/** Campos mínimos de una entrada del reporte que el filtro necesita evaluar. */
export interface LoansReportFilterableEntry {
  lenderId: string | null;
  lenderName: string;
  lenderType: string;
}

function getEnumFilterValues(
  appliedFilters: AppliedFilter[],
  key: string,
  negated: boolean,
): string[] {
  return appliedFilters
    .filter(
      (filter) =>
        filter.key === key &&
        filter.negated === negated &&
        filter.value.kind === "enum",
    )
    .map((filter) => (filter.value as { value: string }).value);
}

function matchesLenderNameText(
  entry: LoansReportFilterableEntry,
  text: string,
): boolean {
  return normalizeFilterSlug(entry.lenderName).includes(
    normalizeFilterSlug(text),
  );
}

/**
 * Aplica la query parseada a las entradas del reporte: `tipo:`/`prestamista:`
 * (OR entre valores repetidos, exclusión con `-`), y el texto libre matchea el
 * nombre del prestamista. `orden:` no filtra (ver {@link getLoansReportSortKey}).
 */
export function filterLoansReportEntries<T extends LoansReportFilterableEntry>(
  entries: T[],
  parsed: ParsedFilterQuery,
): T[] {
  const includedTypes = getEnumFilterValues(parsed.appliedFilters, "tipo", false);
  const excludedTypes = getEnumFilterValues(parsed.appliedFilters, "tipo", true);
  const includedLenderIds = getEnumFilterValues(
    parsed.appliedFilters,
    "prestamista",
    false,
  );
  const excludedLenderIds = getEnumFilterValues(
    parsed.appliedFilters,
    "prestamista",
    true,
  );
  const freeText = parsed.descriptionFilter.trim();

  return entries.filter((entry) => {
    if (includedTypes.length > 0 && !includedTypes.includes(entry.lenderType)) {
      return false;
    }

    if (excludedTypes.includes(entry.lenderType)) {
      return false;
    }

    if (
      includedLenderIds.length > 0 &&
      (entry.lenderId === null || !includedLenderIds.includes(entry.lenderId))
    ) {
      return false;
    }

    if (entry.lenderId !== null && excludedLenderIds.includes(entry.lenderId)) {
      return false;
    }

    if (freeText && !matchesLenderNameText(entry, freeText)) {
      return false;
    }

    if (
      parsed.excludedDescriptionFilters.some((excludedText) =>
        matchesLenderNameText(entry, excludedText),
      )
    ) {
      return false;
    }

    return true;
  });
}

/** Criterio de orden elegido con `orden:`; el último token gana. */
export function getLoansReportSortKey(
  parsed: ParsedFilterQuery,
): LoansReportSortKey {
  const sortValues = getEnumFilterValues(
    parsed.appliedFilters,
    LOANS_REPORT_SORT_QUALIFIER_KEY,
    false,
  );
  const lastSortValue = sortValues[sortValues.length - 1];

  return lastSortValue === "due" ||
    lastSortValue === "lender" ||
    lastSortValue === "amount"
    ? lastSortValue
    : DEFAULT_LOANS_REPORT_SORT_KEY;
}
