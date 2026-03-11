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
      <button
        className="rounded-full border border-white/20 bg-black/20 px-4 py-1.5 text-sm text-slate-200 transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-45"
        onClick={onPrev}
        disabled={currentPage === 1}
      >
        이전
      </button>
      <span className="px-2 text-sm text-slate-300">
        {currentPage} / {totalPages}
      </span>
      <button
        className="rounded-full border border-white/20 bg-black/20 px-4 py-1.5 text-sm text-slate-200 transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-45"
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        다음
      </button>
    </div>
  );
}
