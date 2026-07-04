import { useId, useState, type ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { OccurrenceDurationInput } from "./occurrence-duration-input";
import styles from "./payment-frequency-field.module.scss";

type PaymentFrequencyMode = "single" | "multiple";

interface PaymentFrequencyFieldProps {
  hasError: boolean;
  isChanged: boolean;
  isUnitChanged: boolean;
  occurrencesPerMonth: string;
  occurrencesUnit: string;
  onOccurrencesPerMonthChange: (value: string) => void;
  onOccurrencesUnitChange: (value: string) => void;
}

function isPositiveInteger(value: string): boolean {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0;
}

function getInitialMode(occurrencesPerMonth: string): PaymentFrequencyMode {
  return Number(occurrencesPerMonth) > 1 ? "multiple" : "single";
}

function getInitialMultipleOccurrences(occurrencesPerMonth: string): string {
  if (isPositiveInteger(occurrencesPerMonth) && Number(occurrencesPerMonth) > 1) {
    return String(Number(occurrencesPerMonth));
  }

  return "2";
}

export function PaymentFrequencyField({
  hasError,
  isChanged,
  isUnitChanged,
  occurrencesPerMonth,
  occurrencesUnit,
  onOccurrencesPerMonthChange,
  onOccurrencesUnitChange,
}: PaymentFrequencyFieldProps) {
  const [mode, setMode] = useState<PaymentFrequencyMode>(() =>
    getInitialMode(occurrencesPerMonth),
  );
  const [lastMultipleOccurrences, setLastMultipleOccurrences] = useState(() =>
    getInitialMultipleOccurrences(occurrencesPerMonth),
  );
  const inputIdBase = useId();
  const singleOptionId = `${inputIdBase}-single`;
  const singleOptionLabelId = `${inputIdBase}-single-label`;
  const multipleOptionId = `${inputIdBase}-multiple`;
  const multipleOptionLabelId = `${inputIdBase}-multiple-label`;
  const occurrencesInputId = `${inputIdBase}-occurrences`;
  const showOccurrencesInput = mode === "multiple";

  const handleModeChange = (nextMode: string) => {
    if (nextMode === "multiple") {
      setMode("multiple");
      onOccurrencesPerMonthChange(lastMultipleOccurrences);
      return;
    }

    if (
      isPositiveInteger(occurrencesPerMonth) &&
      Number(occurrencesPerMonth) > 1
    ) {
      setLastMultipleOccurrences(String(Number(occurrencesPerMonth)));
    }

    setMode("single");
    onOccurrencesPerMonthChange("1");
    onOccurrencesUnitChange("");
  };

  const handleOccurrencesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    onOccurrencesPerMonthChange(nextValue);

    if (isPositiveInteger(nextValue) && Number(nextValue) > 1) {
      setLastMultipleOccurrences(String(Number(nextValue)));
    }
  };

  const handleOccurrencesBlur = () => {
    const normalizedValue = occurrencesPerMonth.trim();

    if (!normalizedValue) {
      return;
    }

    const parsedValue = Number(normalizedValue);

    if (!Number.isInteger(parsedValue) || parsedValue < 2) {
      onOccurrencesPerMonthChange("2");
      setLastMultipleOccurrences("2");
      return;
    }

    const normalizedMultipleValue = String(parsedValue);

    if (normalizedMultipleValue !== occurrencesPerMonth) {
      onOccurrencesPerMonthChange(normalizedMultipleValue);
    }

    setLastMultipleOccurrences(normalizedMultipleValue);
  };

  return (
    <div className={styles.container}>
      <RadioGroup
        className={styles.options}
        onValueChange={handleModeChange}
        value={mode}
      >
        {/* Toda la fila es un label del radio: cualquier click (descripción
            incluida) selecciona la opción por semántica nativa. */}
        <label
          className={cn(
            styles.option,
            mode === "single" && styles.optionSelected,
          )}
          htmlFor={singleOptionId}
        >
          <div className={styles.optionHeader}>
            <RadioGroupItem
              aria-labelledby={singleOptionLabelId}
              id={singleOptionId}
              value="single"
            />
            <span className={styles.optionLabel} id={singleOptionLabelId}>
              Un único pago al mes
            </span>
          </div>
          <p className={styles.optionDescription}>
            Ejemplos: alquiler, expensas, agua, energia electrica o internet.
          </p>
        </label>

        <label
          className={cn(
            styles.option,
            mode === "multiple" && styles.optionSelected,
          )}
          htmlFor={multipleOptionId}
        >
          <div className={styles.optionHeader}>
            <RadioGroupItem
              aria-labelledby={multipleOptionLabelId}
              id={multipleOptionId}
              value="multiple"
            />
            <span className={styles.optionLabel} id={multipleOptionLabelId}>
              Se paga varias veces en el mes
            </span>
          </div>
          <p className={styles.optionDescription}>
            Ejemplos: clases de ingles, psicologa o empleada domestica. Si el
            servicio es 2 veces por semana, en 4 semanas serian 8 pagos
            (2 x 4 = 8).
          </p>
        </label>
      </RadioGroup>

      {showOccurrencesInput ? (
        <>
          <div className={styles.occurrencesField}>
            <Label htmlFor={occurrencesInputId}>Veces al mes</Label>
            <Input
              aria-label="Veces al mes"
              className={cn(hasError && styles.invalidField, isChanged && styles.changedField)}
              data-changed={isChanged ? "true" : "false"}
              id={occurrencesInputId}
              inputMode="numeric"
              min="2"
              onBlur={handleOccurrencesBlur}
              onChange={handleOccurrencesChange}
              placeholder="Ej: 8"
              step="1"
              type="number"
              value={occurrencesPerMonth}
            />
          </div>

          <div className={styles.occurrencesField}>
            <OccurrenceDurationInput
              durationHoursAriaLabel="Duración por ocurrencia en horas"
              durationMinutesAriaLabel="Duración por ocurrencia en minutos"
              isChanged={isUnitChanged}
              onChange={onOccurrencesUnitChange}
              value={occurrencesUnit}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
