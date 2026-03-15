import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import styles from "./lender-picker.module.scss";

export interface LenderOption {
  id: string;
  name: string;
  notes?: string;
  type: "bank" | "family" | "friend" | "other";
}

interface LenderPickerProps {
  className?: string;
  emptyMessage?: string;
  hasError?: boolean;
  onAddLender: () => void;
  onSelect: (lenderId: string | null) => void;
  options: LenderOption[];
  placeholder?: string;
  selectedLenderId: string;
  selectedLenderName: string;
}

function getLenderTypeLabel(type: LenderOption["type"]): string {
  switch (type) {
    case "bank":
      return "Banco";
    case "family":
      return "Familiar";
    case "friend":
      return "Amigo";
    case "other":
      return "Otro";
  }
}

export function LenderPicker({
  className,
  emptyMessage = "No hay prestadores registrados todavía.",
  hasError = false,
  onAddLender,
  onSelect,
  options,
  placeholder = "Seleccioná un prestador",
  selectedLenderId,
  selectedLenderName,
}: LenderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.id === selectedLenderId);
  const filteredOptions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase();

    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) =>
      `${option.name} ${getLenderTypeLabel(option.type)}`
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
  }, [options, searchValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target;

      if (!rootRef.current || !(target instanceof Node)) {
        return;
      }

      if (rootRef.current.contains(target)) {
        return;
      }

      setIsOpen(false);
      setSearchValue("");
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isOpen]);

  return (
    <div className={cn(styles.root, className)} ref={rootRef}>
      <Button
        aria-invalid={hasError ? "true" : undefined}
        aria-expanded={isOpen}
        className={styles.trigger}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
        variant="outline"
      >
        {selectedOption?.name || selectedLenderName || placeholder}
      </Button>

      {isOpen ? (
        <div className={styles.panel}>
          <Input
            aria-label="Buscar prestador"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Buscar por nombre o tipo"
            type="text"
            value={searchValue}
          />

          <div className={styles.options}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  className={cn(
                    styles.option,
                    option.id === selectedLenderId && styles.optionSelected,
                  )}
                  key={option.id}
                  onClick={() => {
                    onSelect(option.id);
                    setIsOpen(false);
                    setSearchValue("");
                  }}
                  type="button"
                >
                  <span className={styles.optionName}>{option.name}</span>
                  <span className={styles.optionMeta}>
                    {getLenderTypeLabel(option.type)}
                  </span>
                </button>
              ))
            ) : (
              <p className={styles.emptyMessage}>{emptyMessage}</p>
            )}
          </div>

          <Button
            className={styles.addLenderButton}
            onClick={() => {
              onAddLender();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Agregar prestador
          </Button>
        </div>
      ) : null}
    </div>
  );
}
