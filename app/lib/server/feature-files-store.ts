import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { QaFeatureFile } from "../gherkin";
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

    const saved: QaFeatureFile = {
      ...normalized,
      id: existing?.id ?? normalized.id,
      createdAt: existing?.createdAt ?? normalized.createdAt ?? now,
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
