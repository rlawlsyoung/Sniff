"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  createId,
  parseFeatureText,
  QaFeatureFile,
  QaScenario,
  QaTester,
  ScenarioStatus,
  TesterScenarioResult,
  getScenarioStatusByTesterResults,
} from "../lib/gherkin";

const STORAGE_KEY = "sniff.qa.features.v1";
const LEGACY_STORAGE_KEY = "sniff.qa.scenarios.v1";

type ImportResult =
  | {
      ok: true;
      mode: "created" | "updated";
      scenarioCount: number;
      featureCount: number;
      fileId: string;
    }
  | {
      ok: false;
      message: string;
    };

type GroupedScenario = {
  source: string;
  scenarios: QaScenario[];
};

type TesterDraft = {
  name: string;
  device: string;
  osVersion: string;
};

function toScenarioStatus(value: unknown): ScenarioStatus {
  if (value === "passed" || value === "failed" || value === "todo") {
    return value;
  }

  return "todo";
}

function normalizeTester(value: unknown): QaTester | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<QaTester>;
  const now = new Date().toISOString();
  const name = candidate.name?.trim();

  if (!name) {
    return null;
  }

  return {
    id:
      typeof candidate.id === "string" && candidate.id
        ? candidate.id
        : createId(),
    name,
    device: typeof candidate.device === "string" ? candidate.device.trim() : "",
    osVersion:
      typeof candidate.osVersion === "string" ? candidate.osVersion.trim() : "",
    createdAt:
      typeof candidate.createdAt === "string" && candidate.createdAt
        ? candidate.createdAt
        : now,
    updatedAt:
      typeof candidate.updatedAt === "string" && candidate.updatedAt
        ? candidate.updatedAt
        : now,
  };
}

function normalizeTesterResults(
  value: unknown,
): Record<string, TesterScenarioResult> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const normalized: Record<string, TesterScenarioResult> = {};

  for (const [testerId, result] of entries) {
    if (!testerId || !result || typeof result !== "object") {
      continue;
    }

    const candidate = result as Partial<TesterScenarioResult>;
    normalized[testerId] = {
      status: toScenarioStatus(candidate.status),
      note: typeof candidate.note === "string" ? candidate.note : "",
      updatedAt:
        typeof candidate.updatedAt === "string" && candidate.updatedAt
          ? candidate.updatedAt
          : new Date().toISOString(),
    };
  }

  return normalized;
}

function normalizeScenario(value: unknown): QaScenario | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<QaScenario>;
  const now = new Date().toISOString();

  return {
    id:
      typeof candidate.id === "string" && candidate.id
        ? candidate.id
        : createId(),
    feature:
      typeof candidate.feature === "string" && candidate.feature.trim()
        ? candidate.feature
        : "Untitled Feature",
    title:
      typeof candidate.title === "string" && candidate.title.trim()
        ? candidate.title
        : "Untitled Scenario",
    tags: Array.isArray(candidate.tags)
      ? candidate.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    steps: Array.isArray(candidate.steps)
      ? candidate.steps.filter(
          (step): step is string => typeof step === "string",
        )
      : [],
    source:
      typeof candidate.source === "string" && candidate.source
        ? candidate.source
        : "legacy-import.feature",
    status: toScenarioStatus(candidate.status),
    note: typeof candidate.note === "string" ? candidate.note : "",
    testerResults: normalizeTesterResults(candidate.testerResults),
    createdAt:
      typeof candidate.createdAt === "string" && candidate.createdAt
        ? candidate.createdAt
        : now,
  };
}

function normalizeFeatureFile(value: unknown): QaFeatureFile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<QaFeatureFile>;
  const scenarios = Array.isArray(candidate.scenarios)
    ? candidate.scenarios
        .map((scenario) => normalizeScenario(scenario))
        .filter((scenario): scenario is QaScenario => Boolean(scenario))
    : [];
  const testers = Array.isArray(candidate.testers)
    ? candidate.testers
        .map((tester) => normalizeTester(tester))
        .filter((tester): tester is QaTester => Boolean(tester))
    : [];

  const now = new Date().toISOString();
  const normalizedScenarios = scenarios.map((scenario) => ({
    ...scenario,
    status: getScenarioStatusByTesterResults(scenario, testers),
  }));
  const scenarioFeatureNames = normalizedScenarios.map((item) => item.feature);

  return {
    id:
      typeof candidate.id === "string" && candidate.id
        ? candidate.id
        : createId(),
    fileName:
      typeof candidate.fileName === "string" && candidate.fileName.trim()
        ? candidate.fileName
        : "legacy-import.feature",
    featureNames:
      Array.isArray(candidate.featureNames) && candidate.featureNames.length > 0
        ? candidate.featureNames.filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0,
          )
        : Array.from(new Set(scenarioFeatureNames)),
    scenarios: normalizedScenarios,
    testers,
    createdAt:
      typeof candidate.createdAt === "string" && candidate.createdAt
        ? candidate.createdAt
        : now,
    updatedAt:
      typeof candidate.updatedAt === "string" && candidate.updatedAt
        ? candidate.updatedAt
        : now,
  };
}

function createFeatureFile(params: {
  id?: string;
  fileName: string;
  scenarios: QaScenario[];
  featureNames?: string[];
  testers?: QaTester[];
  createdAt?: string;
}): QaFeatureFile {
  const now = new Date().toISOString();
  const scenarioFeatureNames = params.scenarios.map((item) => item.feature);
  const featureNames =
    params.featureNames && params.featureNames.length > 0
      ? params.featureNames
      : Array.from(new Set(scenarioFeatureNames));

  return {
    id: params.id ?? createId(),
    fileName: params.fileName,
    featureNames,
    scenarios: params.scenarios.map((scenario) => ({
      ...scenario,
      testerResults: scenario.testerResults ?? {},
      status: getScenarioStatusByTesterResults(scenario, params.testers ?? []),
    })),
    testers: params.testers ?? [],
    createdAt: params.createdAt ?? now,
    updatedAt: now,
  };
}

function groupScenariosBySource(scenarios: QaScenario[]): GroupedScenario[] {
  const groups = new Map<string, QaScenario[]>();

  for (const scenario of scenarios) {
    const source = scenario.source || "legacy-import.feature";
    const current = groups.get(source);
    if (current) {
      current.push(scenario);
      continue;
    }

    groups.set(source, [scenario]);
  }

  return Array.from(groups.entries()).map(([source, grouped]) => ({
    source,
    scenarios: grouped,
  }));
}

function loadLegacyFeatureFiles(): QaFeatureFile[] {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as QaScenario[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    const grouped = groupScenariosBySource(parsed);

    return grouped.map((group) =>
      createFeatureFile({
        fileName: group.source,
        scenarios: group.scenarios,
        testers: [],
      }),
    );
  } catch {
    return [];
  }
}

function loadFeatureFiles(): QaFeatureFile[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as QaFeatureFile[];
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => normalizeFeatureFile(item))
          .filter((item): item is QaFeatureFile => Boolean(item));
      }
    } catch {
      return [];
    }
  }

  return loadLegacyFeatureFiles();
}

function createManualFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `manual-${stamp}.feature`;
}

function subscribeHydration() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function useFeatureFiles() {
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot,
  );
  const [featureFiles, setFeatureFiles] = useState<QaFeatureFile[]>(() =>
    loadFeatureFiles(),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(featureFiles));
  }, [featureFiles]);

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
      const existing = featureFiles.find((item) => item.fileName === fileName);
      const mode = existing ? "updated" : "created";
      const fileId = existing ? existing.id : newFile.id;

      setFeatureFiles((previous) => {
        const existingIndex = previous.findIndex(
          (item) => item.fileName === newFile.fileName,
        );

        if (existingIndex === -1) {
          return [newFile, ...previous];
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

        return previous.map((item, index) =>
          index === existingIndex ? updated : item,
        );
      });

      return {
        ok: true,
        mode,
        scenarioCount: parsed.scenarios.length,
        featureCount: parsed.featureCount || 1,
        fileId,
      };
    },
    [featureFiles],
  );

  const updateScenarioStatus = useCallback(
    (fileId: string, scenarioId: string, status: ScenarioStatus) => {
      setFeatureFiles((previous) =>
        previous.map((file) => {
          if (file.id !== fileId) {
            return file;
          }

          const updatedScenarios = file.scenarios.map((scenario) =>
            scenario.id === scenarioId
              ? {
                  ...scenario,
                  status,
                }
              : scenario,
          );

          return {
            ...file,
            scenarios: updatedScenarios,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  const updateScenarioNote = useCallback(
    (fileId: string, scenarioId: string, note: string) => {
      setFeatureFiles((previous) =>
        previous.map((file) => {
          if (file.id !== fileId) {
            return file;
          }

          const updatedScenarios = file.scenarios.map((scenario) =>
            scenario.id === scenarioId
              ? {
                  ...scenario,
                  note,
                }
              : scenario,
          );

          return {
            ...file,
            scenarios: updatedScenarios,
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  const removeFeatureFile = useCallback((fileId: string) => {
    setFeatureFiles((previous) =>
      previous.filter((item) => item.id !== fileId),
    );
  }, []);

  const addTester = useCallback((fileId: string, draft: TesterDraft) => {
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

    setFeatureFiles((previous) =>
      previous.map((file) => {
        if (file.id !== fileId) {
          return file;
        }

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
      }),
    );
  }, []);

  const updateTester = useCallback(
    (fileId: string, testerId: string, draft: TesterDraft) => {
      const trimmedName = draft.name.trim();
      if (!trimmedName) {
        return;
      }

      const now = new Date().toISOString();

      setFeatureFiles((previous) =>
        previous.map((file) => {
          if (file.id !== fileId) {
            return file;
          }

          const updatedTesters = file.testers.map((tester) =>
            tester.id === testerId
              ? {
                  ...tester,
                  name: trimmedName,
                  device: draft.device.trim(),
                  osVersion: draft.osVersion.trim(),
                  updatedAt: now,
                }
              : tester,
          );

          return {
            ...file,
            testers: updatedTesters,
            updatedAt: now,
          };
        }),
      );
    },
    [],
  );

  const removeTester = useCallback((fileId: string, testerId: string) => {
    const now = new Date().toISOString();

    setFeatureFiles((previous) =>
      previous.map((file) => {
        if (file.id !== fileId) {
          return file;
        }

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
      }),
    );
  }, []);

  const updateScenarioTesterResult = useCallback(
    (
      fileId: string,
      scenarioId: string,
      testerId: string,
      updates: Partial<Pick<TesterScenarioResult, "status" | "note">>,
    ) => {
      const now = new Date().toISOString();

      setFeatureFiles((previous) =>
        previous.map((file) => {
          if (file.id !== fileId) {
            return file;
          }

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
        }),
      );
    },
    [],
  );

  const clearFeatureFiles = useCallback(() => {
    setFeatureFiles([]);
  }, []);

  const visibleFeatureFiles = useMemo(() => {
    return isHydrated ? featureFiles : [];
  }, [featureFiles, isHydrated]);

  const featureFileMap = useMemo(() => {
    return new Map(visibleFeatureFiles.map((item) => [item.id, item]));
  }, [visibleFeatureFiles]);

  return {
    isHydrated,
    featureFiles: visibleFeatureFiles,
    featureFileMap,
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
