"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createId,
  getScenarioStatusByTesterResults,
  parseFeatureText,
  QaFeatureFile,
  QaTester,
  ScenarioStatus,
  TesterScenarioResult,
} from "../lib/gherkin";
import {
  createFeatureFile,
  createManualFileName,
  ImportResult,
  normalizeFeatureFile,
  sortFeatureFiles,
  TesterDraft,
} from "../lib/feature-files";

const SYNC_DEBOUNCE_MS = 450;

type FeatureFilesResponse = {
  featureFiles: QaFeatureFile[];
};

type UpsertFeatureFileResponse = {
  featureFile: QaFeatureFile;
};

function replaceFeatureFile(
  previous: QaFeatureFile[],
  nextFile: QaFeatureFile,
  previousId?: string,
) {
  const targetIndex = previous.findIndex(
    (item) =>
      item.id === nextFile.id ||
      (previousId ? item.id === previousId : false) ||
      item.fileName === nextFile.fileName,
  );

  if (targetIndex === -1) {
    return sortFeatureFiles([nextFile, ...previous]);
  }

  const next = [...previous];
  next[targetIndex] = nextFile;
  return sortFeatureFiles(next);
}

async function parseResponseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function useFeatureFiles() {
  const [featureFiles, setFeatureFiles] = useState<QaFeatureFile[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const featureFilesRef = useRef<QaFeatureFile[]>([]);
  const serverUpdatedAtRef = useRef<Map<string, string>>(new Map());
  const syncTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    featureFilesRef.current = featureFiles;
  }, [featureFiles]);

  const refreshFeatureFiles = useCallback(async () => {
    try {
      const response = await fetch("/api/feature-files", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("load-failed");
      }

      const payload = await parseResponseJson<FeatureFilesResponse>(response);
      const normalized = Array.isArray(payload.featureFiles)
        ? payload.featureFiles
            .map((item) => normalizeFeatureFile(item))
            .filter((item): item is QaFeatureFile => Boolean(item))
        : [];

      const nextServerUpdatedAt = new Map<string, string>();
      for (const item of normalized) {
        nextServerUpdatedAt.set(item.id, item.updatedAt);
      }
      serverUpdatedAtRef.current = nextServerUpdatedAt;

      setFeatureFiles(sortFeatureFiles(normalized));
      setSyncError(null);
    } catch {
      setSyncError(
        "서버에서 데이터를 불러오지 못했습니다. 네트워크 연결과 서버 상태를 확인해주세요.",
      );
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const flushFeatureFileSync = useCallback(async (fileId: string) => {
    const target = featureFilesRef.current.find((item) => item.id === fileId);
    if (!target) {
      return;
    }

    const baseUpdatedAt = serverUpdatedAtRef.current.get(fileId);

    try {
      const response = await fetch(
        `/api/feature-files/${encodeURIComponent(fileId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            featureFile: target,
            baseUpdatedAt,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("sync-failed");
      }

      const payload =
        await parseResponseJson<UpsertFeatureFileResponse>(response);
      const saved = normalizeFeatureFile(payload.featureFile);
      if (!saved) {
        throw new Error("invalid-sync-response");
      }

      serverUpdatedAtRef.current.delete(fileId);
      serverUpdatedAtRef.current.set(saved.id, saved.updatedAt);

      setFeatureFiles((previous) =>
        replaceFeatureFile(previous, saved, fileId),
      );
      setSyncError(null);
    } catch {
      setSyncError(
        "변경사항을 서버에 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
  }, []);

  const scheduleFeatureFileSync = useCallback(
    (fileId: string) => {
      const existingTimer = syncTimersRef.current.get(fileId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        syncTimersRef.current.delete(fileId);
        void flushFeatureFileSync(fileId);
      }, SYNC_DEBOUNCE_MS);

      syncTimersRef.current.set(fileId, timer);
    },
    [flushFeatureFileSync],
  );

  const cancelFeatureFileSync = useCallback((fileId: string) => {
    const timer = syncTimersRef.current.get(fileId);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    syncTimersRef.current.delete(fileId);
  }, []);

  useEffect(() => {
    void refreshFeatureFiles();

    const timers = syncTimersRef.current;

    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, [refreshFeatureFiles]);

  const applyFeatureFileMutation = useCallback(
    (fileId: string, mutate: (file: QaFeatureFile) => QaFeatureFile | null) => {
      const previous = featureFilesRef.current;
      let didMutate = false;

      const next = previous.map((file) => {
        if (file.id !== fileId) {
          return file;
        }

        const updated = mutate(file);
        if (!updated) {
          return file;
        }

        didMutate = true;
        return updated;
      });

      if (!didMutate) {
        return;
      }

      const sorted = sortFeatureFiles(next);
      featureFilesRef.current = sorted;
      setFeatureFiles(sorted);
      scheduleFeatureFileSync(fileId);
    },
    [scheduleFeatureFileSync],
  );

  const importFeatureText = useCallback(
    (inputText: string, source?: string): ImportResult => {
      const fileName = source?.trim() || createManualFileName();
      const parsed = parseFeatureText(inputText, fileName);

      if (parsed.scenarios.length === 0) {
        return {
          ok: false,
          message:
            "시나리오를 찾지 못했습니다. `Feature:`와 `Scenario:` 구문을 확인해주세요.",
        };
      }

      const newFile = createFeatureFile({
        fileName,
        scenarios: parsed.scenarios,
        featureNames: parsed.featureNames,
      });

      let result: ImportResult = {
        ok: true,
        mode: "created",
        scenarioCount: parsed.scenarios.length,
        featureCount: parsed.featureCount || 1,
        fileId: newFile.id,
      };

      setFeatureFiles((previous) => {
        const existingIndex = previous.findIndex(
          (item) => item.fileName === newFile.fileName,
        );

        if (existingIndex === -1) {
          result = {
            ok: true,
            mode: "created",
            scenarioCount: parsed.scenarios.length,
            featureCount: parsed.featureCount || 1,
            fileId: newFile.id,
          };

          return sortFeatureFiles([newFile, ...previous]);
        }

        const existing = previous[existingIndex];
        const updated = createFeatureFile({
          id: existing.id,
          fileName: existing.fileName,
          scenarios: newFile.scenarios,
          featureNames: newFile.featureNames,
          testers: existing.testers,
          createdAt: existing.createdAt,
        });

        result = {
          ok: true,
          mode: "updated",
          scenarioCount: parsed.scenarios.length,
          featureCount: parsed.featureCount || 1,
          fileId: existing.id,
        };

        return sortFeatureFiles(
          previous.map((item, index) =>
            index === existingIndex ? updated : item,
          ),
        );
      });

      if (result.ok) {
        scheduleFeatureFileSync(result.fileId);
      }

      return result;
    },
    [scheduleFeatureFileSync],
  );

  const updateScenarioStatus = useCallback(
    (fileId: string, scenarioId: string, status: ScenarioStatus) => {
      applyFeatureFileMutation(fileId, (file) => ({
        ...file,
        scenarios: file.scenarios.map((scenario) =>
          scenario.id === scenarioId
            ? {
                ...scenario,
                status,
              }
            : scenario,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [applyFeatureFileMutation],
  );

  const updateScenarioNote = useCallback(
    (fileId: string, scenarioId: string, note: string) => {
      applyFeatureFileMutation(fileId, (file) => ({
        ...file,
        scenarios: file.scenarios.map((scenario) =>
          scenario.id === scenarioId
            ? {
                ...scenario,
                note,
              }
            : scenario,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [applyFeatureFileMutation],
  );

  const removeFeatureFile = useCallback(
    (fileId: string) => {
      cancelFeatureFileSync(fileId);
      serverUpdatedAtRef.current.delete(fileId);

      setFeatureFiles((previous) =>
        previous.filter((item) => item.id !== fileId),
      );

      void (async () => {
        try {
          const response = await fetch(
            `/api/feature-files/${encodeURIComponent(fileId)}`,
            {
              method: "DELETE",
            },
          );

          if (!response.ok && response.status !== 404) {
            throw new Error("delete-failed");
          }

          setSyncError(null);
        } catch {
          setSyncError(
            "Feature 삭제를 서버에 반영하지 못했습니다. 목록을 다시 불러옵니다.",
          );
          await refreshFeatureFiles();
        }
      })();
    },
    [cancelFeatureFileSync, refreshFeatureFiles],
  );

  const addTester = useCallback(
    (fileId: string, draft: TesterDraft) => {
      const trimmedName = draft.name.trim();
      if (!trimmedName) {
        return;
      }

      const now = new Date().toISOString();
      const tester: QaTester = {
        id: createId(),
        name: trimmedName,
        device: draft.device.trim(),
        osVersion: draft.osVersion.trim(),
        createdAt: now,
        updatedAt: now,
      };

      applyFeatureFileMutation(fileId, (file) => {
        const nextTesters = [...file.testers, tester];
        const shouldSeedLegacyValues = file.testers.length === 0;

        const updatedScenarios = file.scenarios.map((scenario) => {
          const seededResult: TesterScenarioResult = shouldSeedLegacyValues
            ? {
                status: scenario.status,
                note: scenario.note,
                updatedAt: now,
              }
            : {
                status: "todo",
                note: "",
                updatedAt: now,
              };

          const testerResults = {
            ...scenario.testerResults,
            [tester.id]: seededResult,
          };

          return {
            ...scenario,
            testerResults,
            status: getScenarioStatusByTesterResults(
              { ...scenario, testerResults },
              nextTesters,
            ),
          };
        });

        return {
          ...file,
          testers: nextTesters,
          scenarios: updatedScenarios,
          updatedAt: now,
        };
      });
    },
    [applyFeatureFileMutation],
  );

  const updateTester = useCallback(
    (fileId: string, testerId: string, draft: TesterDraft) => {
      const trimmedName = draft.name.trim();
      if (!trimmedName) {
        return;
      }

      const now = new Date().toISOString();

      applyFeatureFileMutation(fileId, (file) => ({
        ...file,
        testers: file.testers.map((tester) =>
          tester.id === testerId
            ? {
                ...tester,
                name: trimmedName,
                device: draft.device.trim(),
                osVersion: draft.osVersion.trim(),
                updatedAt: now,
              }
            : tester,
        ),
        updatedAt: now,
      }));
    },
    [applyFeatureFileMutation],
  );

  const removeTester = useCallback(
    (fileId: string, testerId: string) => {
      const now = new Date().toISOString();

      applyFeatureFileMutation(fileId, (file) => {
        const nextTesters = file.testers.filter(
          (tester) => tester.id !== testerId,
        );

        const updatedScenarios = file.scenarios.map((scenario) => {
          const testerResults = { ...scenario.testerResults };
          delete testerResults[testerId];

          return {
            ...scenario,
            testerResults,
            status: getScenarioStatusByTesterResults(
              { ...scenario, testerResults },
              nextTesters,
            ),
          };
        });

        return {
          ...file,
          testers: nextTesters,
          scenarios: updatedScenarios,
          updatedAt: now,
        };
      });
    },
    [applyFeatureFileMutation],
  );

  const updateScenarioTesterResult = useCallback(
    (
      fileId: string,
      scenarioId: string,
      testerId: string,
      updates: Partial<Pick<TesterScenarioResult, "status" | "note">>,
    ) => {
      const now = new Date().toISOString();

      applyFeatureFileMutation(fileId, (file) => {
        const updatedScenarios = file.scenarios.map((scenario) => {
          if (scenario.id !== scenarioId) {
            return scenario;
          }

          const currentResult = scenario.testerResults[testerId] ?? {
            status: "todo",
            note: "",
            updatedAt: now,
          };

          const nextResult: TesterScenarioResult = {
            status: updates.status ?? currentResult.status,
            note: updates.note ?? currentResult.note,
            updatedAt: now,
          };

          const testerResults = {
            ...scenario.testerResults,
            [testerId]: nextResult,
          };

          return {
            ...scenario,
            testerResults,
            status: getScenarioStatusByTesterResults(
              { ...scenario, testerResults },
              file.testers,
            ),
          };
        });

        return {
          ...file,
          scenarios: updatedScenarios,
          updatedAt: now,
        };
      });
    },
    [applyFeatureFileMutation],
  );

  const clearFeatureFiles = useCallback(() => {
    for (const timer of syncTimersRef.current.values()) {
      clearTimeout(timer);
    }
    syncTimersRef.current.clear();
    serverUpdatedAtRef.current.clear();

    setFeatureFiles([]);

    void (async () => {
      try {
        const response = await fetch("/api/feature-files", {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("clear-failed");
        }

        setSyncError(null);
      } catch {
        setSyncError(
          "전체 삭제를 서버에 반영하지 못했습니다. 다시 불러옵니다.",
        );
        await refreshFeatureFiles();
      }
    })();
  }, [refreshFeatureFiles]);

  const visibleFeatureFiles = useMemo(() => {
    return isHydrated ? featureFiles : [];
  }, [featureFiles, isHydrated]);

  const featureFileMap = useMemo(() => {
    return new Map(visibleFeatureFiles.map((item) => [item.id, item]));
  }, [visibleFeatureFiles]);

  return {
    isHydrated,
    syncError,
    featureFiles: visibleFeatureFiles,
    featureFileMap,
    refreshFeatureFiles,
    importFeatureText,
    updateScenarioStatus,
    updateScenarioNote,
    addTester,
    updateTester,
    removeTester,
    updateScenarioTesterResult,
    removeFeatureFile,
    clearFeatureFiles,
  };
}
