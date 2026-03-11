# AGENTS.md

## Project Overview

- Stack: Next.js App Router + TypeScript.
- Goal: Internal QA management tool using Gherkin (`.feature`) scenarios.
- Runtime target: Works locally first.

## Current Structure

- `app/layout.tsx`: Root layout.
- `app/page.tsx`: Main page entry.
- `app/globals.css`: Global styles.
- `public/`: Static assets.

## Working Rules

- Keep implementation local-first with no mandatory backend dependency.
- Prefer client-side parsing and persistence for MVP.
- Treat `.feature` paste/import parsing as a required path.
- Maintain clean, readable UI with Google-like simplicity.

## Proven Patterns

- Parse Gherkin in `app/lib/gherkin.ts` using `Feature:`, `Scenario:`/`Scenario Outline:`, and step keywords (`Given`, `When`, `Then`, `And`, `But`, `*`).
- Implement clipboard automation in client component with `window` paste listener and `ClipboardEvent.clipboardData.items` file detection.
- Only auto-import when `.feature` file object is present in clipboard; plain path strings cannot be read due to browser sandbox.
- Persist scenario list with `localStorage` key: `sniff.qa.scenarios.v1`.

## Verified Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`

## Known Constraints

- No persistent server/database is defined yet.
- Initial MVP should rely on browser storage for local usage.
