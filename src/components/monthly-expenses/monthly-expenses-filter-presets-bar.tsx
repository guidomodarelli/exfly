import { useState } from "react";
import { Bookmark, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { MonthlyExpensesFilterPreset } from "./monthly-expenses-filter-presets";
import styles from "./monthly-expenses-filter-presets-bar.module.scss";

const EMPTY_PRESET_NAME_ERROR_MESSAGE = "Ingresá un nombre para el filtro.";
const EMPTY_QUERY_ERROR_MESSAGE =
  "Escribí una búsqueda en la barra antes de guardarla.";
const EMPTY_PRESET_QUERY_ERROR_MESSAGE =
  "Ingresá una búsqueda para el filtro.";
const DUPLICATE_PRESET_NAME_ERROR_MESSAGE =
  "Ya existe un filtro con ese nombre.";

interface MonthlyExpensesFilterPresetsBarProps {
  /** Whether the unified filter bar currently has filters worth saving. */
  canSaveCurrentQuery: boolean;
  presets: MonthlyExpensesFilterPreset[];
  onApplyPreset: (preset: MonthlyExpensesFilterPreset) => void;
  onDeletePreset: (presetName: string) => void;
  /**
   * Saves the current bar query under the given name. Returns `false` when
   * there is no query to save.
   */
  onSaveCurrentQuery: (presetName: string) => boolean;
  /** Replaces the preset named `originalName` with the given name and query. */
  onUpdatePreset: (args: {
    name: string;
    originalName: string;
    query: string;
  }) => void;
}

/**
 * Chips de filtros guardados de la barra unificada: guardar la query actual
 * con un nombre, aplicarla con un click y eliminarla.
 */
export function MonthlyExpensesFilterPresetsBar({
  canSaveCurrentQuery,
  presets,
  onApplyPreset,
  onDeletePreset,
  onSaveCurrentQuery,
  onUpdatePreset,
}: MonthlyExpensesFilterPresetsBarProps) {
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);
  const [presetNameDraft, setPresetNameDraft] = useState("");
  const [presetNameError, setPresetNameError] = useState<string | null>(null);
  const [editingPresetName, setEditingPresetName] = useState<string | null>(
    null,
  );
  const [editNameDraft, setEditNameDraft] = useState("");
  const [editQueryDraft, setEditQueryDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

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

  return (
    <div className={styles.presetsBar}>
      <Popover
        onOpenChange={handleSavePopoverOpenChange}
        open={isSavePopoverOpen}
      >
        <PopoverTrigger asChild>
          <Button
            className={styles.saveButton}
            disabled={!canSaveCurrentQuery}
            size="sm"
            type="button"
            variant="outline"
          >
            <Bookmark aria-hidden="true" />
            Guardar filtro
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={styles.savePopover}>
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
            <PopoverContent align="start" className={styles.savePopover}>
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
              <Label htmlFor="filter-preset-edit-query-input">
                Búsqueda del filtro
              </Label>
              <Input
                id="filter-preset-edit-query-input"
                onChange={(event) => {
                  setEditQueryDraft(event.target.value);

                  if (editError) {
                    setEditError(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleConfirmEdit();
                  }
                }}
                type="text"
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
          <button
            aria-label={`Eliminar filtro guardado ${preset.name}`}
            className={styles.presetDeleteButton}
            onClick={() => onDeletePreset(preset.name)}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}
