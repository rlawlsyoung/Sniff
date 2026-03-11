import { QaFeatureFile } from "../../lib/gherkin";
import { FeatureFileCard } from "./feature-file-card";
import { PaginationControls } from "./pagination-controls";

type FeatureFileListSectionProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onClearAll: () => void;
  pagedItems: QaFeatureFile[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onDelete: (id: string) => void;
};

export function FeatureFileListSection({
  query,
  onQueryChange,
  onClearAll,
  pagedItems,
  totalItems,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onDelete,
}: FeatureFileListSectionProps) {
  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl [animation:fade-up_500ms_ease-out_120ms_both]">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-56 flex-1 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none ring-cyan-300/25 placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4"
            placeholder="파일명/Feature 이름 검색"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <span className="rounded-full border border-white/20 bg-black/25 px-3 py-2 text-xs text-slate-300">
            총 {totalItems}개
          </span>
          <button
            className="rounded-full border border-rose-300/40 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"
            onClick={onClearAll}
          >
            전체 삭제
          </button>
        </div>
      </section>

      <section className="grid gap-3 pb-8 [animation:fade-up_560ms_ease-out_180ms_both]">
        {pagedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/25 bg-white/[0.02] p-8 text-center text-sm text-slate-300">
            조건에 맞는 Feature 파일이 없습니다.
          </div>
        ) : (
          pagedItems.map((featureFile) => (
            <FeatureFileCard
              key={featureFile.id}
              featureFile={featureFile}
              onDelete={onDelete}
            />
          ))
        )}
      </section>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={onPrevPage}
        onNext={onNextPage}
      />
    </>
  );
}
