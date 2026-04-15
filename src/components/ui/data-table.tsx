"use client";

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage: string;
  getRowClassName?: (row: TData) => string | undefined;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  filterColumnId?: string;
  filterLabel?: string;
  filterPlaceholder?: string;
  filterValue?: string;
  onFilterValueChange?: (value: string) => void;
  showColumnVisibilityToggle?: boolean;
  columnVisibilityButtonLabel?: string;
  columnVisibilityMenuLabel?: string;
  sortingBadgeLabelOverrides?: Record<string, string>;
  selectAllColumnsLabel?: string;
  deselectAllColumnsLabel?: string;
  hideableColumnsDefaultVisibility?: VisibilityState;
}

interface DataTableColumnMeta {
  label?: string;
  cellClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage,
  getRowClassName,
  sorting: controlledSorting,
  onSortingChange,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  filterColumnId,
  filterLabel = "Filtrar",
  filterPlaceholder = "Filtrar...",
  filterValue: controlledFilterValue,
  onFilterValueChange,
  showColumnVisibilityToggle = false,
  columnVisibilityButtonLabel = "Columnas",
  columnVisibilityMenuLabel = "Mostrar columnas",
  sortingBadgeLabelOverrides,
  selectAllColumnsLabel = "Mostrar todas",
  deselectAllColumnsLabel = "Ocultar todas",
  hideableColumnsDefaultVisibility,
}: DataTableProps<TData, TValue>) {
  const [uncontrolledSorting, setUncontrolledSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [uncontrolledFilterValue, setUncontrolledFilterValue] = React.useState("");
  const [uncontrolledColumnVisibility, setUncontrolledColumnVisibility] =
    React.useState<VisibilityState>({});
  const sorting = controlledSorting ?? uncontrolledSorting;
  const columnVisibility = controlledColumnVisibility ?? uncontrolledColumnVisibility;
  const isFilterValueControlled = controlledFilterValue != null;
  const resolvedFilterValue = isFilterValueControlled
    ? controlledFilterValue
    : uncontrolledFilterValue;

  const handleSortingChange = React.useCallback(
    (updater: SortingState | ((previousState: SortingState) => SortingState)) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;

      if (controlledSorting == null) {
        setUncontrolledSorting(nextSorting);
      }

      onSortingChange?.(nextSorting);
    },
    [controlledSorting, onSortingChange, sorting],
  );

  const handleColumnVisibilityChange = React.useCallback(
    (
      updater:
        | VisibilityState
        | ((previousState: VisibilityState) => VisibilityState),
    ) => {
      if (controlledColumnVisibility == null) {
        setUncontrolledColumnVisibility(updater);
      }

      onColumnVisibilityChange?.(updater);
    },
    [controlledColumnVisibility, onColumnVisibilityChange],
  );

  // TanStack Table manages internal reactive state through this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    state: {
      columnFilters,
      columnVisibility,
      sorting,
    },
  });
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());
  const getHideableColumnDefaultVisibility = React.useCallback(
    (columnId: string): boolean =>
      hideableColumnsDefaultVisibility?.[columnId] ?? true,
    [hideableColumnsDefaultVisibility],
  );
  const areHideableColumnsAtDefaultVisibility = hideableColumns.every(
    (column) =>
      column.getIsVisible() === getHideableColumnDefaultVisibility(column.id),
  );
  const areSomeHideableColumnsVisible = hideableColumns.some((column) =>
    column.getIsVisible(),
  );
  const shouldShowColumnVisibilityToggle =
    showColumnVisibilityToggle && hideableColumns.length > 0;
  const hasModifiedColumnVisibility =
    shouldShowColumnVisibilityToggle && !areHideableColumnsAtDefaultVisibility;
  const hasToolbarChanges = hasModifiedColumnVisibility;
  const shouldShowToolbarActions = shouldShowColumnVisibilityToggle;
  const shouldShowToolbar = Boolean(filterColumnId) || shouldShowToolbarActions;
  const filterColumn = filterColumnId ? table.getColumn(filterColumnId) : undefined;
  const activeSortingEntry = sorting[0];
  const activeSortingColumn = activeSortingEntry
    ? table.getColumn(activeSortingEntry.id)
    : undefined;
  const activeSortingColumnMeta = activeSortingColumn?.columnDef.meta as
    | DataTableColumnMeta
    | undefined;
  const activeSortingColumnLabel =
    (activeSortingEntry
      ? sortingBadgeLabelOverrides?.[activeSortingEntry.id]
      : undefined) ??
    activeSortingColumnMeta?.label ??
    (typeof activeSortingColumn?.columnDef.header === "string"
      ? activeSortingColumn.columnDef.header
      : activeSortingEntry?.id);
  const shouldShowSortingBadge =
    activeSortingEntry != null && activeSortingColumnLabel != null;
  const activeSortingDirectionSymbol = activeSortingEntry?.desc ? "↓" : "↑";
  const activeSortingDirectionLabel = activeSortingEntry?.desc
    ? "descendente"
    : "ascendente";
  const footerGroups = table.getFooterGroups();
  const hasFooterContent = footerGroups.some((footerGroup) =>
    footerGroup.headers.some(
      (footer) => !footer.isPlaceholder && footer.column.columnDef.footer != null,
    ),
  );

  const handleResetSorting = React.useCallback(() => {
    handleSortingChange([]);
  }, [handleSortingChange]);

  React.useEffect(() => {
    if (!filterColumn) {
      return;
    }

    const currentFilterValue = String(filterColumn.getFilterValue() ?? "");

    if (currentFilterValue === resolvedFilterValue) {
      return;
    }

    filterColumn.setFilterValue(resolvedFilterValue);
  }, [filterColumn, resolvedFilterValue]);

  return (
    <div className="grid gap-4">
      {shouldShowToolbar ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {filterColumnId ? (
              <div className="grid w-full max-w-sm gap-2">
                <div className="relative w-full">
                  <Input
                    aria-label={filterLabel}
                    className="w-full pr-9"
                    onChange={(event) => {
                      const nextFilterValue = event.target.value;

                      if (!isFilterValueControlled) {
                        setUncontrolledFilterValue(nextFilterValue);
                      }

                      onFilterValueChange?.(nextFilterValue);
                      filterColumn?.setFilterValue(nextFilterValue);
                    }}
                    placeholder={filterPlaceholder}
                    type="text"
                    value={resolvedFilterValue}
                  />
                  {resolvedFilterValue ? (
                    <Button
                      aria-label="Limpiar filtro"
                      className="absolute right-1 top-1/2 -translate-y-1/2 active:-translate-y-1/2"
                      onClick={() => {
                        if (!isFilterValueControlled) {
                          setUncontrolledFilterValue("");
                        }

                        onFilterValueChange?.("");
                        filterColumn?.setFilterValue("");
                      }}
                      size="icon-xs"
                      type="button"
                      variant="ghost"
                    >
                      <X aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
                {shouldShowSortingBadge ? (
                  <Badge
                    aria-live="polite"
                    className="inline-flex w-fit items-center gap-1.5"
                    variant="secondary"
                  >
                    <span>
                      {`Ordenado por: ${activeSortingColumnLabel} ${activeSortingDirectionSymbol}`}
                    </span>
                    <span className="sr-only">{`Orden ${activeSortingDirectionLabel}`}</span>
                    <button
                      aria-label="Quitar orden"
                      className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={handleResetSorting}
                      type="button"
                    >
                      <X aria-hidden="true" className="size-3" />
                    </button>
                  </Badge>
                ) : null}
              </div>
            ) : null}

            {shouldShowToolbarActions ? (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {shouldShowColumnVisibilityToggle ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label={columnVisibilityButtonLabel}
                        className="relative"
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {columnVisibilityButtonLabel}
                        <ChevronDown aria-hidden="true" />
                        {hasToolbarChanges ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive ring-2 ring-background"
                            />
                            <span className="sr-only">Columnas modificadas</span>
                          </>
                        ) : null}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{columnVisibilityMenuLabel}</DropdownMenuLabel>
                      <DropdownMenuItem
                        disabled={areHideableColumnsAtDefaultVisibility}
                        onSelect={(event) => {
                          event.preventDefault();
                          hideableColumns.forEach((column) => {
                            column.toggleVisibility(
                              getHideableColumnDefaultVisibility(column.id),
                            );
                          });
                        }}
                      >
                        {selectAllColumnsLabel}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!areSomeHideableColumnsVisible}
                        onSelect={(event) => {
                          event.preventDefault();
                          hideableColumns.forEach((column) => {
                            column.toggleVisibility(false);
                          });
                        }}
                      >
                        {deselectAllColumnsLabel}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {hideableColumns.map((column) => {
                        const columnMeta = column.columnDef.meta as
                          | DataTableColumnMeta
                          | undefined;
                        const isColumnVisible = column.getIsVisible();
                        const label =
                          columnMeta?.label ??
                          (typeof column.columnDef.header === "string"
                            ? column.columnDef.header
                            : column.id);

                        return (
                          <DropdownMenuCheckboxItem
                            checked={isColumnVisible}
                            key={column.id}
                            onSelect={(event) => {
                              event.preventDefault();
                            }}
                            onCheckedChange={(nextVisible) => {
                              column.toggleVisibility(Boolean(nextVisible));
                            }}
                          >
                            {label}
                            {!isColumnVisible ? (
                              <>
                                <span
                                  aria-hidden="true"
                                  className="absolute right-2 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background"
                                />
                                <span className="sr-only">Columna deseleccionada</span>
                              </>
                            ) : null}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative w-full overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const rowClassName = getRowClassName?.(row.original);

                return (
                  <TableRow className={rowClassName} key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      const columnMeta = cell.column.columnDef.meta as
                        | DataTableColumnMeta
                        | undefined;

                      return (
                        <TableCell className={columnMeta?.cellClassName} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={Math.max(table.getVisibleLeafColumns().length, 1)}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          {hasFooterContent ? (
            <TableFooter>
              {footerGroups.map((footerGroup) => (
                <TableRow className="hover:bg-transparent" key={footerGroup.id}>
                  {footerGroup.headers.map((footer) => (
                    <TableCell key={footer.id}>
                      {footer.isPlaceholder
                        ? null
                        : flexRender(
                            footer.column.columnDef.footer,
                            footer.getContext(),
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableFooter>
          ) : null}
        </Table>
      </div>
    </div>
  );
}
