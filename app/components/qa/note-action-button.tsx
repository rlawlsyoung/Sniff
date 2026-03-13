import { ComponentPropsWithoutRef } from "react";

type NoteActionButtonVariant = "primary" | "secondary";

type NoteActionButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: NoteActionButtonVariant;
};

const NOTE_ACTION_BUTTON_BASE_CLASSNAME =
  "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-45";

const NOTE_ACTION_BUTTON_VARIANT_CLASSNAME: Record<
  NoteActionButtonVariant,
  string
> = {
  primary:
    "border-cyan-500/55 dark:border-cyan-300/55 bg-cyan-500/14 dark:bg-cyan-300/14 text-cyan-800 dark:text-cyan-100 hover:border-cyan-400/75 dark:border-cyan-200/75 hover:bg-cyan-500/24 dark:bg-cyan-300/24",
  secondary:
    "border-slate-300 dark:border-white/18 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:bg-slate-800",
};

function joinClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function NoteActionButton({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: NoteActionButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        NOTE_ACTION_BUTTON_BASE_CLASSNAME,
        NOTE_ACTION_BUTTON_VARIANT_CLASSNAME[variant],
        className,
      )}
      {...props}
    />
  );
}
