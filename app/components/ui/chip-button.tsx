import { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

type ChipButtonVariant =
  | "neutral"
  | "neutralSoft"
  | "danger"
  | "accent"
  | "subtle"
  | "ghost"
  | "custom";

type ChipButtonSize = "xs" | "sm" | "md" | "mdCompact";

type ChipButtonClassOptions = {
  variant?: ChipButtonVariant;
  size?: ChipButtonSize;
  className?: string;
};

const CHIP_BUTTON_BASE_CLASSNAME =
  "inline-flex items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-45";

const CHIP_BUTTON_SIZE_CLASSNAME: Record<ChipButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  mdCompact: "px-3.5 py-1.5 text-sm",
};

const CHIP_BUTTON_VARIANT_CLASSNAME: Record<ChipButtonVariant, string> = {
  neutral:
    "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
  neutralSoft:
    "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
  danger:
    "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50",
  accent:
    "border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50",
  subtle:
    "border-transparent bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200",
  ghost:
    "border-transparent bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
  custom: "",
};

export function chipButtonClassName({
  variant = "neutral",
  size = "md",
  className,
}: ChipButtonClassOptions = {}) {
  return twMerge(
    CHIP_BUTTON_BASE_CLASSNAME,
    CHIP_BUTTON_SIZE_CLASSNAME[size],
    CHIP_BUTTON_VARIANT_CLASSNAME[variant],
    className,
  );
}

type ChipButtonProps = ComponentPropsWithoutRef<"button"> &
  ChipButtonClassOptions;

export function ChipButton({
  variant = "neutral",
  size = "md",
  className,
  type = "button",
  ...props
}: ChipButtonProps) {
  return (
    <button
      type={type}
      className={chipButtonClassName({ variant, size, className })}
      {...props}
    />
  );
}
