import { QaFeatureFile } from "../../lib/gherkin";
import { FeatureFileCard } from "./feature-file-card";
import { PaginationControls } from "./pagination-controls";

type FeatureFileListSectionProps = {
  query: string;
  onQueryChange: (value: string) => void;
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
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl [animation:fade-up_500ms_ease-out_120ms_both]">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-56 flex-1 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none ring-cyan-500/25 dark:ring-cyan-300/25 placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-slate-500 focus:border-cyan-500/60 dark:border-cyan-300/60 focus:ring-4"
            placeholder="파일명/Feature 이름 검색"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <span className="rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
            총 {totalItems}개
          </span>
        </div>
      </section>

      <section className="grid gap-3 pb-8 [animation:fade-up_560ms_ease-out_180ms_both]">
        {pagedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-8 text-center text-sm text-slate-700 dark:text-slate-300">
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
