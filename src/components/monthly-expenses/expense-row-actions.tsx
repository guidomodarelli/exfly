import { useState } from "react";
import {
  CalendarX2,
  Copy,
  Folder,
  FolderX,
  Link2,
  MoreVertical,
  Pencil,
  Plus,
  Repeat,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import styles from "./expense-row-actions.module.scss";

interface ExpenseRowActionsProps {
  actionDisabled: boolean;
  allReceiptsFolderViewUrl: string | null;
  canDeleteAllReceiptsFolderReference: boolean;
  canDeleteMonthlyFolderReference: boolean;
  description: string;
  hasPaymentLink: boolean;
  /** Whether the expense is an open-ended recurring expense. */
  isRecurring: boolean;
  /** Whether the recurrence has already been cancelled (has an end month). */
  isRecurrenceCancelled: boolean;
  monthlyFolderViewUrl: string | null;
  onCancelRecurrence: () => void;
  onDeleteAllReceiptsFolderReference: () => void;
  onDelete: () => void;
  onDeleteMonthlyFolderReference: () => void;
  onDeletePaymentLink: () => void;
  /** Opens the expense sheet in create mode prefilled with this expense. */
  onDuplicate: () => void;
  onEdit: () => void;
  onManagePaymentLink: () => void;
  onReactivateRecurrence: () => void;
}

export function ExpenseRowActions({
  actionDisabled,
  allReceiptsFolderViewUrl,
  canDeleteAllReceiptsFolderReference,
  canDeleteMonthlyFolderReference,
  description,
  hasPaymentLink,
  isRecurring,
  isRecurrenceCancelled,
  monthlyFolderViewUrl,
  onCancelRecurrence,
  onDeleteAllReceiptsFolderReference,
  onDelete,
  onDeleteMonthlyFolderReference,
  onDeletePaymentLink,
  onDuplicate,
  onEdit,
  onManagePaymentLink,
  onReactivateRecurrence,
}: ExpenseRowActionsProps) {
  const normalizedDescription = description.trim() || "este gasto";
  const [confirmActionType, setConfirmActionType] = useState<
    | "deleteExpense"
    | "deleteMonthlyFolderReference"
    | "deleteAllReceiptsFolderReference"
    | "deletePaymentLink"
    | "cancelRecurrence"
    | null
  >(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shouldRenderFoldersSection =
    Boolean(monthlyFolderViewUrl) ||
    Boolean(allReceiptsFolderViewUrl) ||
    canDeleteMonthlyFolderReference ||
    canDeleteAllReceiptsFolderReference;

  const confirmDialogConfig =
    confirmActionType === "deleteExpense"
      ? {
          actionLabel: "Confirmar",
          ariaLabel: undefined,
          actionVariant: "destructive" as const,
          description:
            "Esta acción guarda el cambio inmediatamente en tu archivo mensual.",
          onConfirm: onDelete,
          title: "¿Querés eliminar este gasto?",
        }
      : confirmActionType === "deleteMonthlyFolderReference"
        ? {
            actionLabel: "Quitar",
            ariaLabel: "Confirmar quitar referencia de carpeta del mes actual",
            actionVariant: "destructive" as const,
            description:
              "Esta acción guarda el cambio inmediatamente en tu archivo mensual.",
            onConfirm: onDeleteMonthlyFolderReference,
            title: "¿Querés quitar la referencia de carpeta del mes actual?",
          }
        : confirmActionType === "deleteAllReceiptsFolderReference"
          ? {
              actionLabel: "Quitar",
              ariaLabel: "Confirmar quitar referencia de carpeta de comprobantes",
              actionVariant: "destructive" as const,
              description:
                "Esta acción guarda el cambio inmediatamente en tu archivo mensual.",
              onConfirm: onDeleteAllReceiptsFolderReference,
              title: "¿Querés quitar la referencia de carpeta de comprobantes?",
            }
          : confirmActionType === "deletePaymentLink"
            ? {
                actionLabel: "Eliminar",
                ariaLabel: `Confirmar eliminación de link de pago para ${normalizedDescription}`,
                actionVariant: "destructive" as const,
                description:
                  "Esta acción guarda el cambio inmediatamente en tu archivo mensual.",
                onConfirm: onDeletePaymentLink,
                title: "¿Querés eliminar este link de pago?",
              }
            : confirmActionType === "cancelRecurrence"
              ? {
                  actionLabel: "Cancelar recurrencia",
                  ariaLabel: `Confirmar cancelación de la recurrencia para ${normalizedDescription}`,
                  actionVariant: "default" as const,
                  description:
                    "El gasto se sigue contando este mes y deja de repetirse en los meses siguientes. Para reactivarlo, abrí sus acciones desde el mes de la cancelación (o uno anterior) y elegí «Reactivar recurrencia».",
                  onConfirm: onCancelRecurrence,
                  title: "¿Querés cancelar la recurrencia?",
                }
              : null;

  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setConfirmActionType(null);
        }
      }}
      open={confirmActionType !== null}
    >
      <DropdownMenu onOpenChange={setIsMenuOpen} open={isMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Abrir acciones para ${normalizedDescription}`}
            className={styles.trigger}
            disabled={actionDisabled}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <MoreVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              setIsMenuOpen(false);
              onEdit();
            }}
          >
            <span className={styles.menuItem}>
              <Pencil aria-hidden="true" />
              Editar
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setIsMenuOpen(false);
              onDuplicate();
            }}
          >
            <span className={styles.menuItem}>
              <Copy aria-hidden="true" />
              Duplicar
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setIsMenuOpen(false);
              setConfirmActionType("deleteExpense");
            }}
            variant="destructive"
          >
            <span className={styles.menuItem}>
              <Trash2 aria-hidden="true" className={styles.destructiveIcon} />
              Eliminar
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isRecurring ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className={styles.menuItem}>
                  <Repeat aria-hidden="true" />
                  Recurrencia
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {isRecurrenceCancelled ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setIsMenuOpen(false);
                      window.setTimeout(() => {
                        onReactivateRecurrence();
                      }, 0);
                    }}
                  >
                    <span className={styles.menuItem}>
                      <RotateCcw aria-hidden="true" />
                      Reactivar recurrencia
                    </span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => {
                      setIsMenuOpen(false);
                      setConfirmActionType("cancelRecurrence");
                    }}
                  >
                    <span className={styles.menuItem}>
                      <CalendarX2 aria-hidden="true" />
                      Cancelar recurrencia
                    </span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : null}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className={styles.menuItem}>
                <Link2 aria-hidden="true" />
                Link de pago
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {hasPaymentLink ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      setIsMenuOpen(false);
                      window.setTimeout(() => {
                        onManagePaymentLink();
                      }, 0);
                    }}
                  >
                    <span className={styles.menuItem}>
                      <Pencil aria-hidden="true" />
                      Editar link de pago
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setIsMenuOpen(false);
                      setConfirmActionType("deletePaymentLink");
                    }}
                    variant="destructive"
                  >
                    <span className={styles.menuItem}>
                      <Trash2 aria-hidden="true" className={styles.destructiveIcon} />
                      Eliminar link de pago
                    </span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onSelect={() => {
                    setIsMenuOpen(false);
                    window.setTimeout(() => {
                      onManagePaymentLink();
                    }, 0);
                  }}
                >
                  <span className={styles.menuItem}>
                    <Plus aria-hidden="true" />
                    Agregar link de pago
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {shouldRenderFoldersSection ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className={styles.menuItem}>
                  <Folder aria-hidden="true" />
                  Carpetas
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {monthlyFolderViewUrl ? (
                  <DropdownMenuItem asChild>
                    <a
                      href={monthlyFolderViewUrl}
                      onClick={() => setIsMenuOpen(false)}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className={styles.menuItem}>
                        <Folder aria-hidden="true" />
                        Comprobantes del mes
                      </span>
                    </a>
                  </DropdownMenuItem>
                ) : null}
                {allReceiptsFolderViewUrl ? (
                  <DropdownMenuItem asChild>
                    <a
                      href={allReceiptsFolderViewUrl}
                      onClick={() => setIsMenuOpen(false)}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className={styles.menuItem}>
                        <Folder aria-hidden="true" />
                        Archivo histórico de comprobantes
                      </span>
                    </a>
                  </DropdownMenuItem>
                ) : null}
                {canDeleteMonthlyFolderReference ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setIsMenuOpen(false);
                      setConfirmActionType("deleteMonthlyFolderReference");
                    }}
                    variant="destructive"
                  >
                    <span className={styles.menuItem}>
                      <FolderX aria-hidden="true" className={styles.destructiveIcon} />
                      Quitar referencia de carpeta del mes actual
                    </span>
                  </DropdownMenuItem>
                ) : null}
                {canDeleteAllReceiptsFolderReference ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setIsMenuOpen(false);
                      setConfirmActionType("deleteAllReceiptsFolderReference");
                    }}
                    variant="destructive"
                  >
                    <span className={styles.menuItem}>
                      <FolderX aria-hidden="true" className={styles.destructiveIcon} />
                      Quitar referencia de carpeta de comprobantes
                    </span>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {confirmDialogConfig ? (
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              aria-label={confirmDialogConfig.ariaLabel}
              onClick={() => {
                setConfirmActionType(null);
                confirmDialogConfig.onConfirm();
              }}
              variant={confirmDialogConfig.actionVariant}
            >
              {confirmDialogConfig.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  );
}
