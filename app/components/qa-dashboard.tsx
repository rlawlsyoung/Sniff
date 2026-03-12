"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FeatureFileListSection } from "./qa/feature-file-list-section";
import { FeatureImportPanel } from "./qa/feature-import-panel";
import { FeatureDeletePopup } from "./qa/feature-delete-popup";
import { QaPageShell } from "./qa/qa-page-shell";
import { useFeatureFiles } from "../hooks/use-feature-files";

const ITEMS_PER_PAGE = 6;

type ImportNotice = {
  type: "success" | "error";
  message: string;
};

function isFeatureLikeText(text: string) {
  return (
    /(^|\n)\s*Feature:\s*/i.test(text) &&
    /(^|\n)\s*Scenario(?: Outline)?:\s*/i.test(text)
  );
}

export default function QaDashboard() {
  const { featureFiles, importFeatureText, removeFeatureFile } =
    useFeatureFiles();
  const [rawText, setRawText] = useState("");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [notice, setNotice] = useState<ImportNotice | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return featureFiles.filter((item) => {
      if (!q) {
        return true;
      }

      const haystack = [item.fileName, item.featureNames.join(" ")]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [featureFiles, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);

  const pagedItems = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [activePage, filtered]);

  const applyImport = useCallback(
    (text: string, source?: string) => {
      const result = importFeatureText(text, source);
      if (!result.ok) {
        setNotice({ type: "error", message: result.message });
        return false;
      }

      setNotice({
        type: "success",
        message:
          result.mode === "created"
            ? `${result.scenarioCount}개 QA 항목을 가져왔습니다 (${result.featureCount}개 Feature).`
            : `${source || "manual"} 파일을 갱신했습니다 (${result.scenarioCount}개 시나리오).`,
      });
      return true;
    },
    [importFeatureText],
  );

  const importFromClipboardData = useCallback(
    async (clipboardData: DataTransfer, allowTextImport: boolean) => {
      const items = Array.from(clipboardData.items || []);

      for (const item of items) {
        if (item.kind !== "file") {
          continue;
        }

        const file = item.getAsFile();
        if (!file) {
          continue;
        }

        if (file.name.toLowerCase().endsWith(".feature")) {
          const text = await file.text();
          return applyImport(text, file.name);
        }
      }

      const plainText = clipboardData.getData("text/plain");
      if (!allowTextImport || !plainText.trim()) {
        return false;
      }

      if (/^[^\n\r]+\.feature$/i.test(plainText.trim())) {
        setNotice({
          type: "error",
          message:
            "파일 경로 문자열만 붙여넣어진 상태입니다. 브라우저 보안상 로컬 파일 경로는 읽을 수 없어, 파일 자체를 붙여넣거나 아래 업로드를 사용해주세요.",
        });
        return false;
      }

      if (isFeatureLikeText(plainText)) {
        return applyImport(plainText, "clipboard.feature");
      }

      return false;
    },
    [applyImport],
  );

  useEffect(() => {
    const onPaste = async (event: ClipboardEvent) => {
      if (!event.clipboardData) {
        return;
      }

      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      const hasFeatureFile = Array.from(event.clipboardData.items || []).some(
        (item) => {
          if (item.kind !== "file") {
            return false;
          }

          const file = item.getAsFile();
          return Boolean(file && file.name.toLowerCase().endsWith(".feature"));
        },
      );

      const imported = await importFromClipboardData(
        event.clipboardData,
        !isEditableTarget || hasFeatureFile,
      );
      if (imported) {
        event.preventDefault();
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [importFromClipboardData]);

  const onParseTextarea = () => {
    const imported = applyImport(rawText);
    if (imported) {
      setRawText("");
    }
  };

  const onDelete = (fileId: string) => {
    setPendingDeleteId(fileId);
  };

  const onConfirmDelete = () => {
    if (!pendingDeleteId) {
      return;
    }

    removeFeatureFile(pendingDeleteId);
    setPendingDeleteId(null);
    setNotice({ type: "success", message: "Feature 파일을 삭제했습니다." });
  };

  const importFeatureFile = async (file: File) => {
    if (
      !file.name.toLowerCase().endsWith(".feature") &&
      !file.type.includes("text")
    ) {
      return;
    }

    const text = await file.text();
    applyImport(text, file.name);
  };

  const onFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      await importFeatureFile(file);
    }
    event.target.value = "";
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const files = Array.from(event.dataTransfer.files || []);
    for (const file of files) {
      await importFeatureFile(file);
    }
  };

  const onPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, Math.min(activePage, prev) - 1));
  };

  const onNextPage = () => {
    setCurrentPage((prev) =>
      Math.min(totalPages, Math.min(activePage, prev) + 1),
    );
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  return (
    <QaPageShell includeBottomGlow>
      <h1 className="font-brand text-[38px] font-semibold tracking-[0.25em] text-transparent [text-shadow:0_0_34px_rgba(99,235,255,0.28)] bg-[linear-gradient(110deg,#dcf8ff_0%,#99ecff_38%,#8de5ff_62%,#f8fdff_100%)] bg-clip-text sm:text-[48px]">
        SNIFF
      </h1>

      <FeatureImportPanel
        isDragActive={isDragActive}
        rawText={rawText}
        onRawTextChange={setRawText}
        onFileInput={onFileInput}
        onParseTextarea={onParseTextarea}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />

      {notice ? (
        <section
          className={`rounded-2xl border px-4 py-3 text-sm backdrop-blur ${
            notice.type === "success"
              ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
              : "border-rose-300/35 bg-rose-300/10 text-rose-100"
          }`}
        >
          {notice.message}
        </section>
      ) : null}

      <FeatureFileListSection
        query={query}
        onQueryChange={onQueryChange}
        pagedItems={pagedItems}
        totalItems={filtered.length}
        currentPage={activePage}
        totalPages={totalPages}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
        onDelete={onDelete}
      />

      <FeatureDeletePopup
        open={Boolean(pendingDeleteId)}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={onConfirmDelete}
      />
    </QaPageShell>
  );
}
