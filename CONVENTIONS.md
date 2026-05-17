# MikeDown Conventions

## Product Direction
MikeDown is a local-first macOS Markdown workbench for reading, editing, and exporting Markdown files, especially AI-generated technical documents. Prefer practical file workflows over note-app sprawl.

## Code Style
Use TypeScript with 2-space indentation, semicolons, double quotes, and functional React components. Import app modules through the `@/` alias when the target is under `src/`. Keep component state local only when it is purely presentational; shared workflow state belongs in `src/store/appStore.ts`.

## Behavior Boundaries
File operations should go through Tauri plugins. Markdown export should use the rendered preview DOM when fidelity matters. Any delayed tab work must capture the originating tab id instead of reading `activeTabId` later.

## Testing
Use focused Vitest tests for store, library, and component behavior. Run `pnpm test` and `pnpm build` before reporting feature completion. For Rust or release workflow changes, also run the command set documented in `AGENTS.md`.
