import { ComponentPropsWithoutRef } from "react";

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
  "inline-flex items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-45";

const CHIP_BUTTON_SIZE_CLASSNAME: Record<ChipButtonSize, string> = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  mdCompact: "px-3.5 py-1.5 text-sm",
};

const CHIP_BUTTON_VARIANT_CLASSNAME: Record<ChipButtonVariant, string> = {
  neutral: "border-white/20 bg-black/30 text-slate-200 hover:border-white/40",
  neutralSoft:
    "border-white/20 bg-black/20 text-slate-200 hover:border-white/35",
  danger:
    "border-rose-300/45 bg-rose-300/10 text-rose-100 hover:bg-rose-300/20",
  accent:
    "border-cyan-300/45 bg-cyan-300/12 text-cyan-100 hover:bg-cyan-300/20",
  subtle:
    "border-white/15 bg-black/30 text-slate-300 hover:border-white/35 hover:text-slate-100",
  ghost:
    "border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-slate-100",
  custom: "",
};

function joinClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function chipButtonClassName({
  variant = "neutral",
  size = "md",
  className,
}: ChipButtonClassOptions = {}) {
  return joinClassNames(
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
