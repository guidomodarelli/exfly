import {
  Button,
  FilterQueryBar,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type FilterQualifierConfig,
} from "beez-ui";
import { useState } from "react";
import { Bookmark, Pencil, X } from "lucide-react";

import type { MonthlyExpensesFilterPreset } from "./monthly-expenses-filter-presets";
import styles from "./monthly-expenses-filter-presets-bar.module.scss";

const EMPTY_PRESET_NAME_ERROR_MESSAGE = "Ingresá un nombre para el filtro.";
const EMPTY_QUERY_ERROR_MESSAGE =
  "Escribí una búsqueda en la barra antes de guardarla.";
const EMPTY_PRESET_QUERY_ERROR_MESSAGE =
  "Ingresá una búsqueda para el filtro.";
const DUPLICATE_PRESET_NAME_ERROR_MESSAGE =
  "Ya existe un filtro con ese nombre.";

interface MonthlyExpensesFilterPresetSaveButtonProps {
  /** Whether the unified filter bar currently has filters worth saving. */
  canSaveCurrentQuery: boolean;
  /**
   * Saves the current bar query under the given name. Returns `false` when
   * there is no query to save.
   */
  onSaveCurrentQuery: (presetName: string) => boolean;
}

interface MonthlyExpensesFilterPresetsBarProps {
  presets: MonthlyExpensesFilterPreset[];
  /** Qualifiers de la barra unificada, para autocompletar al editar la query. */
  queryFilterConfigs: FilterQualifierConfig[];
  onApplyPreset: (preset: MonthlyExpensesFilterPreset) => void;
  onDeletePreset: (presetName: string) => void;
  /** Replaces the preset named `originalName` with the given name and query. */
  onUpdatePreset: (args: {
    name: string;
    originalName: string;
    query: string;
  }) => void;
}

/**
 * Botón compacto para guardar la query actual como preset con nombre. Pensado
 * para el slot de acción dentro del input de la barra unificada.
 */
export function MonthlyExpensesFilterPresetSaveButton({
  canSaveCurrentQuery,
  onSaveCurrentQuery,
}: MonthlyExpensesFilterPresetSaveButtonProps) {
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
  const [presetNameDraft, setPresetNameDraft] = useState("");
  const [presetNameError, setPresetNameError] = useState<string | null>(null);

  const handleSavePopoverOpenChange = (nextOpen: boolean) => {
    setIsSavePopoverOpen(nextOpen);

    if (!nextOpen) {
      setPresetNameDraft("");
      setPresetNameError(null);
    }
  };

  const handleConfirmSave = () => {
    const normalizedPresetName = presetNameDraft.trim();

    if (!normalizedPresetName) {
      setPresetNameError(EMPTY_PRESET_NAME_ERROR_MESSAGE);
      return;
    }

    if (!onSaveCurrentQuery(normalizedPresetName)) {
      setPresetNameError(EMPTY_QUERY_ERROR_MESSAGE);
      return;
    }

    handleSavePopoverOpenChange(false);
  };

  return (
    <Popover
      onOpenChange={handleSavePopoverOpenChange}
      open={isSavePopoverOpen}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              aria-label="Guardar filtro"
              className="active:-translate-y-0"
              disabled={!canSaveCurrentQuery}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Bookmark aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Guardar filtro</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className={styles.savePopover}>
        <Label htmlFor="filter-preset-name-input">Nombre del filtro</Label>
        <Input
          id="filter-preset-name-input"
          onChange={(event) => {
            setPresetNameDraft(event.target.value);

            if (presetNameError) {
              setPresetNameError(null);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleConfirmSave();
            }
          }}
          placeholder="Deudas grandes"
          type="text"
          value={presetNameDraft}
        />
        {presetNameError ? (
          <p className={styles.savePopoverError} role="alert">
            {presetNameError}
          </p>
        ) : null}
        <Button
          aria-label="Guardar filtro con nombre"
          onClick={handleConfirmSave}
          size="sm"
          type="button"
        >
          Guardar
        </Button>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Chips de filtros guardados de la barra unificada: guardar la query actual
 * con un nombre, aplicarla con un click y eliminarla.
 */
export function MonthlyExpensesFilterPresetsBar({
  presets,
  queryFilterConfigs,
  onApplyPreset,
  onDeletePreset,
  onUpdatePreset,
}: MonthlyExpensesFilterPresetsBarProps) {
  const [editingPresetName, setEditingPresetName] = useState<string | null>(
    null,
  );
  const [editNameDraft, setEditNameDraft] = useState("");
  const [editQueryDraft, setEditQueryDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  // Preset con la confirmación de borrado abierta (la X no elimina directo).
  const [deletingPresetName, setDeletingPresetName] = useState<string | null>(
    null,
  );

  const handleEditPopoverOpenChange = (
    preset: MonthlyExpensesFilterPreset,
    nextOpen: boolean,
  ) => {
    if (!nextOpen) {
      setEditingPresetName(null);
      setEditError(null);
      return;
    }

    setEditingPresetName(preset.name);
    setEditNameDraft(preset.name);
    setEditQueryDraft(preset.query);
    setEditError(null);
  };

  const handleConfirmEdit = () => {
    if (editingPresetName === null) {
      return;
    }

    const normalizedName = editNameDraft.trim();
    const normalizedQuery = editQueryDraft.trim();

    if (!normalizedName) {
      setEditError(EMPTY_PRESET_NAME_ERROR_MESSAGE);
      return;
    }

    if (!normalizedQuery) {
      setEditError(EMPTY_PRESET_QUERY_ERROR_MESSAGE);
      return;
    }

    const isNameTakenByAnotherPreset = presets.some(
      (preset) =>
        preset.name === normalizedName && preset.name !== editingPresetName,
    );

    if (isNameTakenByAnotherPreset) {
      setEditError(DUPLICATE_PRESET_NAME_ERROR_MESSAGE);
      return;
    }

    onUpdatePreset({
      name: normalizedName,
      originalName: editingPresetName,
      query: normalizedQuery,
    });
    setEditingPresetName(null);
    setEditError(null);
  };

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className={styles.presetsBar}>
      <span className={styles.presetsBarLabel}>
        <Bookmark aria-hidden="true" />
        Filtros guardados:
      </span>
      {presets.map((preset) => (
        <span className={styles.presetChip} key={preset.name}>
          <button
            aria-label={`Aplicar filtro guardado ${preset.name}`}
            className={styles.presetApplyButton}
            onClick={() => onApplyPreset(preset)}
            title={preset.query}
            type="button"
          >
            {preset.name}
          </button>
          <Popover
            onOpenChange={(nextOpen) =>
              handleEditPopoverOpenChange(preset, nextOpen)
            }
            open={editingPresetName === preset.name}
          >
            <PopoverTrigger asChild>
              <button
                aria-label={`Editar filtro guardado ${preset.name}`}
                className={styles.presetEditButton}
                type="button"
              >
                <Pencil aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className={styles.savePopover}
              onInteractOutside={(event) => {
                // Las sugerencias de la barra de búsqueda se portalean fuera de
                // este popover: interactuar con ellas no debe cerrarlo.
                const interactionTarget = event.target;

                if (
                  interactionTarget instanceof Element &&
                  interactionTarget.closest('[data-slot="popover-content"]')
                ) {
                  event.preventDefault();
                }
              }}
            >
              <Label htmlFor="filter-preset-edit-name-input">
                Nombre del filtro
              </Label>
              <Input
                id="filter-preset-edit-name-input"
                onChange={(event) => {
                  setEditNameDraft(event.target.value);

                  if (editError) {
                    setEditError(null);
                  }
                }}
                type="text"
                value={editNameDraft}
              />
              <span className={styles.savePopoverCaption}>
                Búsqueda del filtro
              </span>
              <FilterQueryBar
                ariaLabel="Búsqueda del filtro"
                configs={queryFilterConfigs}
                onValueChange={(nextQuery) => {
                  setEditQueryDraft(nextQuery);

                  if (editError) {
                    setEditError(null);
                  }
                }}
                placeholder="total:>1000 direccion:me-deben"
                value={editQueryDraft}
              />
              {editError ? (
                <p className={styles.savePopoverError} role="alert">
                  {editError}
                </p>
              ) : null}
              <Button
                aria-label="Guardar cambios del filtro"
                onClick={handleConfirmEdit}
                size="sm"
                type="button"
              >
                Guardar
              </Button>
            </PopoverContent>
          </Popover>
          <Popover
            onOpenChange={(nextOpen) =>
              setDeletingPresetName(nextOpen ? preset.name : null)
            }
            open={deletingPresetName === preset.name}
          >
            <PopoverTrigger asChild>
              <button
                aria-label={`Eliminar filtro guardado ${preset.name}`}
                className={styles.presetDeleteButton}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className={styles.deletePopover}>
              <p className={styles.deletePopoverMessage}>
                {`¿Querés eliminar el filtro guardado "${preset.name}"?`}
              </p>
              <div className={styles.deletePopoverActions}>
                <Button
                  onClick={() => setDeletingPresetName(null)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setDeletingPresetName(null);
                    onDeletePreset(preset.name);
                  }}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  Eliminar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </span>
      ))}
    </div>
  );
}
