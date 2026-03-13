"use client";

import type { ReactNode } from "react";

type QaPageShellProps = {
  children: ReactNode;
  maxWidthClassName?: string;
  contentGapClassName?: string;
  includeBottomGlow?: boolean;
};

export function QaPageShell({
  children,
  maxWidthClassName = "max-w-6xl",
  contentGapClassName = "gap-5",
  includeBottomGlow = false,
}: QaPageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 text-foreground sm:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-[-120px] h-[280px] w-[280px] rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-24 top-[120px] h-[240px] w-[240px] rounded-full bg-emerald-500/15 dark:bg-emerald-300/15 blur-3xl" />
        {includeBottomGlow ? (
          <div className="absolute bottom-[-100px] left-1/3 h-[220px] w-[360px] rounded-full bg-blue-500/10 blur-3xl" />
        ) : null}
      </div>

      <div
        className={`relative mx-auto flex w-full flex-col ${maxWidthClassName} ${contentGapClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
