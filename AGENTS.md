# AGENTS.md

## Project Overview

- Stack: Next.js App Router + TypeScript.
- Goal: Internal QA management tool using Gherkin (`.feature`) scenarios.
- Runtime target: Local-first + LAN shared access in internal network.

## Current Structure

- `app/layout.tsx`: Root layout.
- `app/page.tsx`: Main page entry.
- `app/globals.css`: Global styles.
- `app/api/feature-files/route.ts`: Feature file list/clear API.
- `app/api/feature-files/[fileId]/route.ts`: Feature file upsert/delete API.
- `app/lib/server/feature-files-store.ts`: Server persistence layer.
- `app/lib/feature-files.ts`: Shared normalization/create helpers.
- `public/`: Static assets.

## Working Rules

- Keep implementation local-first, with one LAN host running the app for internal shared usage.
- Use Next.js Route Handlers as the data boundary (`/api/feature-files`).
- Persist data on server-side file storage (`data/feature-files.json`) or configured file path.
- Treat `.feature` paste/import parsing as a required path.
- Maintain clean, readable UI with Google-like simplicity.
- When major behavior or architecture changes are made, update `AGENTS.md` in the same task so team guidance stays current.

## Proven Patterns

- Parse Gherkin in `app/lib/gherkin.ts` using `Feature:`, `Scenario:`/`Scenario Outline:`, and step keywords (`Given`, `When`, `Then`, `And`, `But`, `*`).
- Implement clipboard automation in client component with `window` paste listener and `ClipboardEvent.clipboardData.items` file detection.
- Only auto-import when `.feature` file object is present in clipboard; plain path strings cannot be read due to browser sandbox.
- Use `useFeatureFiles` API sync flow: load via `GET /api/feature-files`, save via `PUT /api/feature-files/[fileId]`, remove via `DELETE /api/feature-files/[fileId]`.
- For multi-PC stale writes, send `baseUpdatedAt` from client and merge on server in `app/lib/server/feature-files-store.ts` instead of last-write overwrite.
- Resolve stale-write conflicts by merging testers, scenario tester results (latest `updatedAt` wins per tester result), and recalculating aggregate scenario status.
- In `useFeatureFiles`, avoid mutable sync flags that are set inside `setState` updaters; compute mutations from `featureFilesRef.current` and schedule sync immediately after committing next state.
- Server store default path is `data/feature-files.json`, override with env `SNIFF_DATA_FILE`.

## Verified Commands

- Install: `pnpm install`
- Dev: `pnpm dev` (binds to `0.0.0.0:3000` for LAN access)
- Build: `pnpm build`
- Lint: `pnpm lint`

## Known Constraints

- Current persistence backend is file-based JSON storage, not SQLite yet.
- For shared use, one internal PC should keep the app process running and expose LAN-reachable IP.
