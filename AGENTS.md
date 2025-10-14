# Repository Guidelines

## Project Structure & Module Organization
LabTalkAgent is a pnpm workspace monorepo. `apps/server` handles HTTP/WebSocket orchestration and pipelines (ASR, LLM, TTS, RAG). `apps/windows-client` streams VAD chunks, `apps/character-ui` renders avatar state, and `apps/room-hub` targets room capture. Shared utilities live in `packages/`: `shared` exports protocol/types, `audio-utils` covers PCM helpers, and `rag-core` indexes and queries local PDFs. Keep environment templates in each package’s `.env.example` and place secrets in `.env.local`.

## Build, Test, and Development Commands
Run `pnpm install` once to bootstrap all workspaces. Use `pnpm build` for a TypeScript compile across `apps/*` and `packages/*`. Development loops: `pnpm dev:server` starts the Express/WebSocket server on :8787, `pnpm --filter @lta/character-ui dev` launches the Vite UI, and `pnpm --filter @lta/windows-client dev` or `pnpm --filter @lta/room-hub dev` drive the capture clients. `pnpm lint` and `pnpm format` fan out ESLint and Prettier across the tree; keep them clean before sending changes.

## Coding Style & Naming Conventions
Stick to ES module TypeScript with 2-space indentation and `strict` compiler defaults. Prefer `camelCase` for variables/functions, `PascalCase` for types/components, and `kebab-case` file names (e.g. `services/tts.voicevox.ts`). Pipeline adapters live in `services/<feature>.<provider>.ts`; shared constants stay under `packages/shared`. Let Prettier handle layout and rely on ESLint for unused code and import order.

## Testing Guidelines
Tests are not scaffolded yet—add package-level suites alongside the modules they cover (e.g. `packages/rag-core/src/__tests__/search.spec.ts`). Introduce a `test` script per workspace and wire it into the root via `pnpm -r test` so CI can exercise every area. Focus on deterministic pipeline steps: mock external ASR/LLM/TTS services, assert message contracts from `@lta/shared`, and include sample audio buffer fixtures where possible.

## Commit & Pull Request Guidelines
Follow the existing history: short, imperative commit subjects such as “Add windows client VAD mock”. Keep feature and refactor commits separate, and run `pnpm build && pnpm lint` before pushing. Pull requests should describe the affected app/package, list manual test commands run, reference issue IDs, and attach screenshots or logs when UI or pipeline behavior changes. Note any new environment variables or service endpoints in the description.

## Security & Configuration Tips
Duplicate `.env.example` files into environment-specific `.env.local` variants; never commit secrets. When integrating external ASR/LLM providers, guard network calls behind configuration checks and supply offline fallbacks so `pnpm dev:*` still works without credentials.
