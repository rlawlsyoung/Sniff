export type ScenarioStatus = "todo" | "passed" | "failed";

export type QaScenario = {
  id: string;
  feature: string;
  title: string;
  tags: string[];
  steps: string[];
  source: string;
  status: ScenarioStatus;
  note: string;
  createdAt: string;
};

export type QaFeatureFile = {
  id: string;
  fileName: string;
  featureNames: string[];
  scenarios: QaScenario[];
  createdAt: string;
  updatedAt: string;
};

export type ScenarioStats = {
  total: number;
  todo: number;
  passed: number;
  failed: number;
  passRate: number;
};

export type ParseFeatureResult = {
  scenarios: QaScenario[];
  featureCount: number;
  featureNames: string[];
};

const STEP_PATTERN = /^(Given|When|Then|And|But|\*)\b/i;
const SCENARIO_PATTERN = /^Scenario(?: Outline)?:\s*(.+)$/i;
const FEATURE_PATTERN = /^Feature:\s*(.+)$/i;

export function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `qa-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function parseFeatureText(
  input: string,
  source = "pasted.feature",
): ParseFeatureResult {
  const lines = input.split(/\r?\n/);
  const scenarios: QaScenario[] = [];
  const featureNames: string[] = [];

  let currentFeature = "Untitled Feature";
  let currentScenarioIndex = -1;
  let pendingTags: string[] = [];
  let featureCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const featureMatch = line.match(FEATURE_PATTERN);
    if (featureMatch) {
      currentFeature = featureMatch[1].trim() || "Untitled Feature";
      featureNames.push(currentFeature);
      featureCount += 1;
      continue;
    }

    if (line.startsWith("@")) {
      const tags = line
        .split(/\s+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.startsWith("@"));
      pendingTags = [...pendingTags, ...tags];
      continue;
    }

    const scenarioMatch = line.match(SCENARIO_PATTERN);
    if (scenarioMatch) {
      scenarios.push({
        id: createId(),
        feature: currentFeature,
        title: scenarioMatch[1].trim() || "Untitled Scenario",
        tags: pendingTags,
        steps: [],
        source,
        status: "todo",
        note: "",
        createdAt: new Date().toISOString(),
      });
      currentScenarioIndex = scenarios.length - 1;
      pendingTags = [];
      continue;
    }

    if (currentScenarioIndex === -1) {
      continue;
    }

    if (
      STEP_PATTERN.test(line) ||
      /^Examples:\s*$/i.test(line) ||
      line.startsWith("|")
    ) {
      scenarios[currentScenarioIndex].steps.push(line);
    }
  }

  return {
    scenarios,
    featureCount,
    featureNames,
  };
}

export function mergeScenarios(
  existing: QaScenario[],
  incoming: QaScenario[],
): QaScenario[] {
  return [...incoming, ...existing];
}

export function getScenarioStats(scenarios: QaScenario[]): ScenarioStats {
  const total = scenarios.length;
  const todo = scenarios.filter((item) => item.status === "todo").length;
  const passed = scenarios.filter((item) => item.status === "passed").length;
  const failed = scenarios.filter((item) => item.status === "failed").length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return { total, todo, passed, failed, passRate };
}
