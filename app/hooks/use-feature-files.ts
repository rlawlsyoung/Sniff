"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createId,
  parseFeatureText,
  QaFeatureFile,
  QaScenario,
  ScenarioStatus,
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

function createFeatureFile(params: {
  id?: string;
  fileName: string;
  scenarios: QaScenario[];
  featureNames?: string[];
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
    scenarios: params.scenarios,
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
        return parsed;
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

export function useFeatureFiles() {
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
            scenario.id === scenarioId ? { ...scenario, status } : scenario,
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
            scenario.id === scenarioId ? { ...scenario, note } : scenario,
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

  const clearFeatureFiles = useCallback(() => {
    setFeatureFiles([]);
  }, []);

  const featureFileMap = useMemo(() => {
    return new Map(featureFiles.map((item) => [item.id, item]));
  }, [featureFiles]);

  return {
    featureFiles,
    featureFileMap,
    importFeatureText,
    updateScenarioStatus,
    updateScenarioNote,
    removeFeatureFile,
    clearFeatureFiles,
  };
}
