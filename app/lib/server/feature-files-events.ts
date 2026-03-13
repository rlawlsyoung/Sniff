export type FeatureFilesStoreEvent = {
  type: "upsert" | "delete" | "clear";
  fileId?: string;
  updatedAt: string;
};

type FeatureFilesEventListener = (event: FeatureFilesStoreEvent) => void;

const listeners = new Set<FeatureFilesEventListener>();

export function publishFeatureFilesEvent(event: FeatureFilesStoreEvent) {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Ignore listener failures to avoid breaking publisher flow.
    }
  }
}

export function subscribeFeatureFilesEvents(listener: FeatureFilesEventListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}