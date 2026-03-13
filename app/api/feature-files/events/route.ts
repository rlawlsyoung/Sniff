import { subscribeFeatureFilesEvents } from "@/app/lib/server/feature-files-events";
import { listFeatureFiles } from "@/app/lib/server/feature-files-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeatureFilesConnectedEvent = {
  type: "connected";
  updatedAt: string;
};

type FeatureFilesSyncEvent = {
  type: "sync";
  updatedAt: string;
};

function toSseMessage(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false;

      const send = (chunk: string) => {
        if (isClosed) {
          return;
        }

        controller.enqueue(encoder.encode(chunk));
      };

      const close = () => {
        if (isClosed) {
          return;
        }

        isClosed = true;
        cleanup();

        try {
          controller.close();
        } catch {
          // Ignore close errors when stream is already closed.
        }
      };

      send("retry: 3000\n\n");

      const connectedEvent: FeatureFilesConnectedEvent = {
        type: "connected",
        updatedAt: new Date().toISOString(),
      };
      send(toSseMessage("feature-files", connectedEvent));

      const unsubscribe = subscribeFeatureFilesEvents((event) => {
        send(toSseMessage("feature-files", event));
      });

      let snapshotKey = "";
      let isPolling = false;

      const buildSnapshotKey = async () => {
        const featureFiles = await listFeatureFiles();
        return featureFiles
          .map((file) => `${file.id}:${file.updatedAt}`)
          .sort()
          .join("|");
      };

      const pollStoreChanges = async () => {
        if (isPolling) {
          return;
        }

        isPolling = true;
        try {
          const nextSnapshotKey = await buildSnapshotKey();
          if (!snapshotKey) {
            snapshotKey = nextSnapshotKey;
            return;
          }

          if (nextSnapshotKey !== snapshotKey) {
            snapshotKey = nextSnapshotKey;

            const syncEvent: FeatureFilesSyncEvent = {
              type: "sync",
              updatedAt: new Date().toISOString(),
            };
            send(toSseMessage("feature-files", syncEvent));
          }
        } catch {
          // Ignore transient store read errors and retry on next tick.
        } finally {
          isPolling = false;
        }
      };

      void pollStoreChanges();

      const heartbeat = setInterval(() => {
        send(": keepalive\n\n");
      }, 25_000);
      const storePollTimer = setInterval(() => {
        void pollStoreChanges();
      }, 1_000);

      const onAbort = () => {
        close();
      };

      request.signal.addEventListener("abort", onAbort, { once: true });

      cleanup = () => {
        clearInterval(heartbeat);
        clearInterval(storePollTimer);
        unsubscribe();
        request.signal.removeEventListener("abort", onAbort);
      };
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}