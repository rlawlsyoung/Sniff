import {
  createId,
  getScenarioStatusByTesterResults,
  QaFeatureFile,
  QaScenario,
  QaTester,
  ScenarioStatus,
  TesterScenarioResult,
} from "./gherkin";

export type ImportResult =
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

export type TesterDraft = {
  name: string;
  device: string;
  osVersion: string;
};

export function toScenarioStatus(value: unknown): ScenarioStatus {
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

export function normalizeFeatureFile(value: unknown): QaFeatureFile | null {
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

export function createFeatureFile(params: {
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

export function createManualFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `manual-${stamp}.feature`;
}

export function sortFeatureFiles(featureFiles: QaFeatureFile[]) {
  return [...featureFiles].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
