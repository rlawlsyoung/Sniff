import { useState } from "react";
import {
  QaScenario,
  QaTester,
  ScenarioStatus,
  TesterScenarioResult,
} from "../../lib/gherkin";
import { ChipButton } from "../ui/chip-button";
import { NoteActionButton } from "./note-action-button";

const STATUS_LABELS: Record<ScenarioStatus, string> = {
  todo: "미실행",
  passed: "통과",
  failed: "실패",
};

const STATUS_BUTTON_STYLES: Record<ScenarioStatus, string> = {
  todo: "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
  passed:
    "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
  failed:
    "border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50",
};

type ParsedStepRow = {
  keyword: string;
  content: string;
  kind: "step" | "examples" | "table" | "text";
  cells?: string[];
};

type ExamplesTableBlock = {
  header: string[];
  rows: string[][];
};

type DisplayRow =
  | {
      kind: "row";
      row: ParsedStepRow;
    }
  | {
      kind: "examples-table";
      table: ExamplesTableBlock;
    };

const KEYWORD_STYLES: Record<string, string> = {
  Given:
    "border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300",
  When: "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
  Then: "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
  And: "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300",
  But: "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300",
  Step: "border-cyan-200 dark:border-cyan-900/50 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300",
  Examples:
    "border-violet-200 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300",
  Table:
    "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-300",
  Text: "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-300",
};

function toKeywordLabel(rawKeyword: string) {
  if (rawKeyword === "*") {
    return "Step";
  }

  const lowerKeyword = rawKeyword.toLowerCase();
  return `${lowerKeyword.charAt(0).toUpperCase()}${lowerKeyword.slice(1)}`;
}

function parseStep(step: string): ParsedStepRow {
  const trimmedStep = step.trim();

  if (/^Examples:\s*$/i.test(trimmedStep)) {
    return {
      keyword: "Examples",
      content: "",
      kind: "examples",
    };
  }

  if (trimmedStep.startsWith("|")) {
    const cells = trimmedStep
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    return {
      keyword: "Table",
      content: trimmedStep,
      kind: "table",
      cells,
    };
  }

  const keywordMatch = trimmedStep.match(
    /^(Given|When|Then|And|But|\*)\s*(.*)$/i,
  );
  if (keywordMatch) {
    return {
      keyword: toKeywordLabel(keywordMatch[1]),
      content: keywordMatch[2].trim(),
      kind: "step",
    };
  }

  return {
    keyword: "Text",
    content: trimmedStep,
    kind: "text",
  };
}

function createExamplesTableBlock(
  tableRows: string[][],
): ExamplesTableBlock | null {
  if (tableRows.length === 0) {
    return null;
  }

  const columnCount = Math.max(1, ...tableRows.map((row) => row.length));
  const [rawHeader, ...rawRows] = tableRows;

  const header = Array.from({ length: columnCount }, (_, index) => {
    const headerCell = rawHeader[index]?.trim();
    return headerCell || `컬럼 ${index + 1}`;
  });

  const rows = rawRows.map((row) =>
    Array.from(
      { length: columnCount },
      (_, index) => row[index]?.trim() || "-",
    ),
  );

  return {
    header,
    rows,
  };
}

function buildDisplayRows(parsedSteps: ParsedStepRow[]): DisplayRow[] {
  const displayRows: DisplayRow[] = [];

  for (let index = 0; index < parsedSteps.length; index += 1) {
    const current = parsedSteps[index];

    if (current.kind === "examples") {
      const tableRows: string[][] = [];
      let cursor = index + 1;

      while (
        cursor < parsedSteps.length &&
        parsedSteps[cursor].kind === "table"
      ) {
        tableRows.push(parsedSteps[cursor].cells ?? []);
        cursor += 1;
      }

      const table = createExamplesTableBlock(tableRows);
      if (table) {
        displayRows.push({
          kind: "examples-table",
          table,
        });
        index = cursor - 1;
        continue;
      }
    }

    displayRows.push({
      kind: "row",
      row: current,
    });
  }

  return displayRows;
}

type ScenarioCardProps = {
  scenario: QaScenario;
  testers: QaTester[];
  onTesterResultChange: (
    scenarioId: string,
    testerId: string,
    updates: Partial<Pick<TesterScenarioResult, "status" | "note">>,
  ) => void;
};

export function ScenarioCard({
  scenario,
  testers,
  onTesterResultChange,
}: ScenarioCardProps) {
  const [noteDraftByTesterId, setNoteDraftByTesterId] = useState<
    Record<string, string>
  >({});
  const [editingTesterMap, setEditingTesterMap] = useState<
    Record<string, true>
  >({});

  const parsedSteps = scenario.steps.map(parseStep);
  const displayRows = buildDisplayRows(parsedSteps);

  const setTesterNoteDraft = (testerId: string, note: string) => {
    setNoteDraftByTesterId((previous) => ({
      ...previous,
      [testerId]: note,
    }));
  };

  const clearTesterNoteDraft = (testerId: string) => {
    setNoteDraftByTesterId((previous) => {
      if (!(testerId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[testerId];
      return next;
    });
  };

  const startTesterNoteEdit = (testerId: string, currentNote: string) => {
    setEditingTesterMap((previous) => ({
      ...previous,
      [testerId]: true,
    }));
    setTesterNoteDraft(testerId, currentNote);
  };

  const stopTesterNoteEdit = (testerId: string) => {
    setEditingTesterMap((previous) => {
      if (!(testerId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[testerId];
      return next;
    });
  };

  const submitTesterNote = (
    scenarioId: string,
    testerId: string,
    savedNote: string,
    draftNote: string,
  ) => {
    if (draftNote !== savedNote) {
      onTesterResultChange(scenarioId, testerId, {
        note: draftNote,
      });
    }

    stopTesterNoteEdit(testerId);
    clearTesterNoteDraft(testerId);
  };

  const cancelTesterNoteEdit = (testerId: string) => {
    stopTesterNoteEdit(testerId);
    clearTesterNoteDraft(testerId);
  };

  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 p-5 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50 dark:bg-cyan-950/30 px-3 py-1 text-xs font-semibold text-cyan-800 dark:text-cyan-300">
          {scenario.feature}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
        {scenario.title}
      </h3>

      {scenario.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scenario.tags.map((tag) => (
            <span
              key={`${scenario.id}-${tag}`}
              className="rounded-full border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {displayRows.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 backdrop-blur-sm">
          <table className="w-full border-collapse text-sm text-slate-800 dark:text-slate-200">
            <thead className="bg-slate-200/60 dark:bg-slate-800/60 text-xs uppercase tracking-wide text-slate-700 dark:text-slate-300">
              <tr>
                <th className="w-28 px-3 py-2 text-left font-semibold">문법</th>
                <th className="px-3 py-2 text-left font-semibold">내용</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((displayRow, index) => {
                if (displayRow.kind === "examples-table") {
                  const columnCount = displayRow.table.header.length;

                  return (
                    <tr
                      key={`${scenario.id}-step-${index}`}
                      className="border-t border-slate-200 dark:border-slate-800 align-top"
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            KEYWORD_STYLES.Examples
                          }`}
                        >
                          Examples
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-900 dark:text-slate-100">
                        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-950/40 backdrop-blur-md">
                          <table className="w-full border-collapse text-xs text-slate-800 dark:text-slate-200">
                            <thead className="bg-slate-200/80 dark:bg-slate-700/50 text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-300">
                              <tr>
                                {displayRow.table.header.map(
                                  (headerCell, headerIndex) => (
                                    <th
                                      key={`${scenario.id}-examples-head-${index}-${headerIndex}`}
                                      className="border-b border-slate-200 dark:border-slate-700 px-2.5 py-2 text-left font-semibold"
                                    >
                                      {headerCell}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {displayRow.table.rows.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={columnCount}
                                    className="px-2.5 py-2 text-slate-600 dark:text-slate-400"
                                  >
                                    예제 데이터 행이 없습니다.
                                  </td>
                                </tr>
                              ) : (
                                displayRow.table.rows.map(
                                  (rowCells, rowIndex) => (
                                    <tr
                                      key={`${scenario.id}-examples-row-${index}-${rowIndex}`}
                                      className="border-t border-slate-200 dark:border-slate-800"
                                    >
                                      {rowCells.map((cell, cellIndex) => (
                                        <td
                                          key={`${scenario.id}-examples-cell-${index}-${rowIndex}-${cellIndex}`}
                                          className="px-2.5 py-2 text-slate-900 dark:text-slate-100"
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ),
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const row = displayRow.row;

                return (
                  <tr
                    key={`${scenario.id}-step-${index}`}
                    className="border-t border-slate-200 dark:border-slate-800 align-top"
                  >
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          KEYWORD_STYLES[row.keyword] ?? KEYWORD_STYLES.Text
                        }`}
                      >
                        {row.keyword}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-900 dark:text-slate-100">
                      {row.kind === "examples" ? (
                        <span className="text-slate-700 dark:text-slate-300">
                          예제 블록에 테이블 데이터가 없습니다.
                        </span>
                      ) : row.kind === "table" ? (
                        row.cells && row.cells.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {row.cells.map((cell, cellIndex) => (
                              <span
                                key={`${scenario.id}-step-${index}-cell-${cellIndex}`}
                                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                              >
                                {cell}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <code className="text-xs text-slate-700 dark:text-slate-300">
                            | |
                          </code>
                        )
                      ) : row.content ? (
                        row.content
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">
                          (내용 없음)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          등록된 Step이 없습니다.
        </p>
      )}

      {testers.length === 0 ? (
        <>
          <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            등록된 진행자가 없어 QA를 진행할 수 없습니다. 먼저 상단에서 진행자를
            추가해주세요.
          </div>
        </>
      ) : (
        <section className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-700 dark:text-slate-300">
              QA 진행 기록
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              진행자 {testers.length}명
            </p>
          </div>

          <div className="mt-3 grid gap-3">
            {testers.map((tester) => {
              const result = scenario.testerResults[tester.id] ?? {
                status: "todo",
                note: "",
              };
              const savedNote = result.note;
              const hasSavedNote = savedNote.trim().length > 0;
              const isEditing =
                editingTesterMap[tester.id] === true || !hasSavedNote;
              const draftNote = noteDraftByTesterId[tester.id] ?? savedNote;
              const isNoteChanged = draftNote !== savedNote;
              const testerMeta = [tester.device, tester.osVersion]
                .filter((value) => value.trim().length > 0)
                .join(" / ");

              return (
                <div
                  key={`${scenario.id}-${tester.id}`}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 backdrop-blur-xl p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {tester.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {testerMeta || "기기/OS 정보 미입력"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["todo", "passed", "failed"] as ScenarioStatus[]).map(
                      (status) => (
                        <ChipButton
                          key={`${scenario.id}-${tester.id}-${status}`}
                          variant="custom"
                          size="xs"
                          className={`px-3 font-semibold ${
                            result.status === status
                              ? status === "todo"
                                ? "border-slate-200/80 bg-slate-200 text-slate-900"
                                : status === "passed"
                                  ? "border-emerald-500/80 dark:border-emerald-300/80 bg-emerald-300 text-emerald-950"
                                  : "border-rose-500/80 dark:border-rose-300/80 bg-rose-300 text-rose-950"
                              : STATUS_BUTTON_STYLES[status]
                          }`}
                          onClick={() =>
                            onTesterResultChange(scenario.id, tester.id, {
                              status,
                            })
                          }
                        >
                          {STATUS_LABELS[status]}
                        </ChipButton>
                      ),
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-2">
                      <textarea
                        className="h-24 w-full resize-y rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none ring-cyan-500/25 dark:ring-cyan-300/25 placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-slate-500 focus:border-cyan-500/60 dark:border-cyan-300/60 focus:ring-4"
                        placeholder={`${tester.name} 진행 메모`}
                        value={draftNote}
                        onChange={(event) =>
                          setTesterNoteDraft(tester.id, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            (event.metaKey || event.ctrlKey) &&
                            event.key === "Enter"
                          ) {
                            submitTesterNote(
                              scenario.id,
                              tester.id,
                              savedNote,
                              draftNote,
                            );
                          }
                        }}
                      />

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          입력 후 등록 버튼을 눌러 저장합니다.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {hasSavedNote ? (
                            <NoteActionButton
                              onClick={() => cancelTesterNoteEdit(tester.id)}
                            >
                              취소
                            </NoteActionButton>
                          ) : null}
                          <NoteActionButton
                            variant="primary"
                            disabled={!isNoteChanged}
                            onClick={() =>
                              submitTesterNote(
                                scenario.id,
                                tester.id,
                                savedNote,
                                draftNote,
                              )
                            }
                          >
                            등록
                          </NoteActionButton>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="min-h-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-2.5 py-2 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                        {savedNote}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <NoteActionButton
                          onClick={() =>
                            startTesterNoteEdit(tester.id, savedNote)
                          }
                        >
                          수정
                        </NoteActionButton>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
