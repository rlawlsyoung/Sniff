"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ChipButton } from "./chip-button";

type PopupTone = "default" | "danger";

type PopupProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: PopupTone;
  onConfirm: () => void;
  onClose: () => void;
};

export function Popup({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel,
  tone = "default",
  onConfirm,
  onClose,
}: PopupProps) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="popup-overlay fixed inset-0 z-50 bg-slate-900/20 dark:bg-[#02050d]/80 backdrop-blur-sm" />

        <AlertDialog.Content className="popup-content fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md gap-4 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[linear-gradient(180deg,rgba(15,24,40,0.94)_0%,rgba(10,16,30,0.94)_100%)] p-6 text-slate-900 dark:text-slate-100 shadow-xl shadow-slate-900/20 dark:shadow-black/50 focus:outline-none">
          <AlertDialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </AlertDialog.Title>

          {description ? (
            <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {description}
            </AlertDialog.Description>
          ) : null}

          <div className="mt-6 flex items-center justify-end gap-2">
            {cancelLabel ? (
              <AlertDialog.Cancel asChild>
                <ChipButton className="font-medium">{cancelLabel}</ChipButton>
              </AlertDialog.Cancel>
            ) : null}

            <AlertDialog.Action asChild>
              <ChipButton
                variant={tone === "danger" ? "danger" : "accent"}
                className="font-semibold"
                onClick={onConfirm}
              >
                {confirmLabel}
              </ChipButton>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
