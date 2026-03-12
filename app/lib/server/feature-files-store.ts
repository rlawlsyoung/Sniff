import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getScenarioStatusByTesterResults,
  QaFeatureFile,
  QaScenario,
  QaTester,
  TesterScenarioResult,
} from "../gherkin";
import { normalizeFeatureFile, sortFeatureFiles } from "../feature-files";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE =
  process.env.SNIFF_DATA_FILE?.trim() ||
  path.join(DATA_DIR, "feature-files.json");

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWriteTask<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureStoreFile() {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, "[]\n", "utf8");
  }
}

async function readFeatureFilesUnsafe(): Promise<QaFeatureFile[]> {
  await ensureStoreFile();

  const raw = await readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return sortFeatureFiles(
    parsed
      .map((item) => normalizeFeatureFile(item))
      .filter((item): item is QaFeatureFile => Boolean(item)),
  );
}

async function writeFeatureFilesUnsafe(featureFiles: QaFeatureFile[]) {
  await ensureStoreFile();

  const payload = `${JSON.stringify(sortFeatureFiles(featureFiles), null, 2)}\n`;
  await writeFile(DATA_FILE, payload, "utf8");
}

function pickLatestResult(
  existing: TesterScenarioResult,
  incoming: TesterScenarioResult,
): TesterScenarioResult {
  return existing.updatedAt >= incoming.updatedAt ? existing : incoming;
}

function mergeTesterResults(
  existing: Record<string, TesterScenarioResult>,
  incoming: Record<string, TesterScenarioResult>,
): Record<string, TesterScenarioResult> {
  const testerIds = new Set([
    ...Object.keys(existing),
    ...Object.keys(incoming),
  ]);

  const merged: Record<string, TesterScenarioResult> = {};
  for (const testerId of testerIds) {
    const existingResult = existing[testerId];
    const incomingResult = incoming[testerId];

    if (!existingResult) {
      merged[testerId] = incomingResult;
      continue;
    }

    if (!incomingResult) {
      merged[testerId] = existingResult;
      continue;
    }

    merged[testerId] = pickLatestResult(existingResult, incomingResult);
  }

  return merged;
}

function mergeTesters(existing: QaTester[], incoming: QaTester[]): QaTester[] {
  const byId = new Map<string, QaTester>();

  for (const tester of existing) {
    byId.set(tester.id, tester);
  }

  for (const tester of incoming) {
    const prev = byId.get(tester.id);
    if (!prev) {
      byId.set(tester.id, tester);
      continue;
    }

    byId.set(tester.id, {
      ...prev,
      ...tester,
      createdAt: prev.createdAt || tester.createdAt,
      updatedAt:
        prev.updatedAt >= tester.updatedAt ? prev.updatedAt : tester.updatedAt,
    });
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

function mergeScenarios(
  existing: QaScenario[],
  incoming: QaScenario[],
  mergedTesters: QaTester[],
): QaScenario[] {
  const incomingById = new Map(
    incoming.map((scenario) => [scenario.id, scenario]),
  );

  const merged = existing.map((scenario) => {
    const incomingScenario = incomingById.get(scenario.id);
    if (!incomingScenario) {
      return scenario;
    }

    incomingById.delete(scenario.id);

    const testerResults = mergeTesterResults(
      scenario.testerResults,
      incomingScenario.testerResults,
    );

    const candidate: QaScenario = {
      ...scenario,
      ...incomingScenario,
      createdAt: scenario.createdAt || incomingScenario.createdAt,
      testerResults,
    };

    return {
      ...candidate,
      status: getScenarioStatusByTesterResults(candidate, mergedTesters),
    };
  });

  for (const scenario of incomingById.values()) {
    const candidate: QaScenario = {
      ...scenario,
      testerResults: mergeTesterResults({}, scenario.testerResults),
    };

    merged.push({
      ...candidate,
      status: getScenarioStatusByTesterResults(candidate, mergedTesters),
    });
  }

  return merged;
}

function mergeFeatureFileOnConflict(
  existing: QaFeatureFile,
  incoming: QaFeatureFile,
  now: string,
): QaFeatureFile {
  const testers = mergeTesters(existing.testers, incoming.testers);
  const scenarios = mergeScenarios(
    existing.scenarios,
    incoming.scenarios,
    testers,
  );
  const featureNames = Array.from(
    new Set([...existing.featureNames, ...incoming.featureNames]),
  );

  return {
    ...existing,
    ...incoming,
    id: existing.id,
    fileName: existing.fileName,
    featureNames,
    testers,
    scenarios,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
}

export async function listFeatureFiles(): Promise<QaFeatureFile[]> {
  await writeQueue;

  try {
    return await readFeatureFilesUnsafe();
  } catch {
    return [];
  }
}

export async function upsertFeatureFile(
  featureFile: QaFeatureFile,
  options?: {
    baseUpdatedAt?: string;
  },
): Promise<QaFeatureFile> {
  return enqueueWriteTask(async () => {
    const normalized = normalizeFeatureFile(featureFile);
    if (!normalized) {
      throw new Error("invalid-feature-file");
    }

    const now = new Date().toISOString();
    const current = await readFeatureFilesUnsafe();

    const existing =
      current.find((item) => item.id === normalized.id) ??
      current.find((item) => item.fileName === normalized.fileName);

    const isConflict =
      Boolean(existing) &&
      (!options?.baseUpdatedAt ||
        options.baseUpdatedAt !== existing?.updatedAt);

    const saved: QaFeatureFile = existing
      ? isConflict
        ? mergeFeatureFileOnConflict(existing, normalized, now)
        : {
            ...normalized,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: now,
          }
      : {
          ...normalized,
          id: normalized.id,
          createdAt: normalized.createdAt ?? now,
          updatedAt: now,
        };

    const next = current.filter(
      (item) => item.id !== existing?.id && item.fileName !== saved.fileName,
    );
    next.unshift(saved);

    await writeFeatureFilesUnsafe(next);
    return saved;
  });
}

export async function deleteFeatureFile(fileId: string): Promise<boolean> {
  return enqueueWriteTask(async () => {
    const current = await readFeatureFilesUnsafe();
    const next = current.filter((item) => item.id !== fileId);

    const removed = next.length !== current.length;
    if (removed) {
      await writeFeatureFilesUnsafe(next);
    }

    return removed;
  });
}

export async function clearFeatureFiles(): Promise<void> {
  await enqueueWriteTask(async () => {
    await writeFeatureFilesUnsafe([]);
  });
}
