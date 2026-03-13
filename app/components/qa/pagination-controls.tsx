import { ChipButton } from "../ui/chip-button";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

export function PaginationControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <ChipButton
        variant="neutralSoft"
        size="mdCompact"
        onClick={onPrev}
        disabled={currentPage === 1}
      >
        이전
      </ChipButton>
      <span className="px-2 text-sm text-slate-700 dark:text-slate-300">
        {currentPage} / {totalPages}
      </span>
      <ChipButton
        variant="neutralSoft"
        size="mdCompact"
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        다음
      </ChipButton>
    </div>
  );
}
