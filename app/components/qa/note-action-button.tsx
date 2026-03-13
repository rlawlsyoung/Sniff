import { ComponentPropsWithoutRef } from "react";

type NoteActionButtonVariant = "primary" | "secondary";

type NoteActionButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: NoteActionButtonVariant;
};

const NOTE_ACTION_BUTTON_BASE_CLASSNAME =
  "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-45";

const NOTE_ACTION_BUTTON_VARIANT_CLASSNAME: Record<
  NoteActionButtonVariant,
  string
> = {
  primary:
    "border-cyan-300/55 bg-cyan-300/14 text-cyan-100 hover:border-cyan-200/75 hover:bg-cyan-300/24",
  secondary:
    "border-white/18 bg-black/35 text-slate-200 hover:border-white/35 hover:bg-black/45",
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
