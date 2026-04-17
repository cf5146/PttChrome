---
name: pttchrome-modernization-phase
description: 'Execute one approved modernization phase in PttChrome. Use for Vite migration, TypeScript foundation, React 18 and react-bootstrap upgrades, Zustand migration, phase validation, or checkpoint commits on the legacy-to-modern roadmap.'
argument-hint: 'Phase or checkpoint to execute, e.g. "continue Phase 3 React 18 migration"'
---

# PttChrome Modernization Phase

## Outcome

Implement exactly one approved modernization phase or checkpoint in PttChrome and leave the repo in a validated, commit-ready state.

## When To Use

- Continue the saved modernization plan phase by phase.
- Turn a broad modernization request into incremental, validated changes.
- Checkpoint a migration branch with a working commit after build, typecheck, and smoke test.

## Repository Constraints

- Entry flow is `src/entry.ts` -> `src/js/main.tsx` -> `App` in `src/js/pttchrome.js`.
- Preserve the websocket defaults from `src/js/runtime_env.js`: production `wsstelnet://ws.ptt.cc/bbs`, development `wstelnet://localhost:8080/bbs`, and query-string site override only when `ALLOW_SITE_IN_QUERY=yes`.
- Keep these DOM mount ids stable unless the phase explicitly changes them: `cmdHandler`, `cmenuReact`, `BBSWindow`, `t`, `cursor`, `reactAlert`.
- Keep user-visible strings in `src/js/i18n.js`, `src/js/en_US_messages.js`, and `src/js/zh_TW_messages.js` synchronized.
- Do not modernize unrelated legacy core files opportunistically; keep changes scoped to the active phase.

## Procedure

1. Re-load context.
   - Read `.github/copilot-instructions.md` and the instruction files that apply to the files you will touch.
   - Read `/memories/session/plan.md` if the modernization plan already exists.
   - Re-read `package.json`, active config files, and any file the user says may have changed.
2. Confirm the baseline.
   - Run `git branch --show-current` and `git status --short`.
   - Identify the current phase, the last validated checkpoint, and the scope that should be implemented now.
   - If the request is still architectural, refresh the phased plan before editing.
3. Search before editing.
   - Search for the legacy APIs, dependency names, or lifecycle methods being migrated in this phase.
   - Read the whole entry path and the directly affected files before choosing an edit strategy.
4. Prefer low-blast-radius migrations.
   - Preserve runtime contracts between the legacy terminal core and the React layer.
   - Use adapters or compatibility layers when a dependency upgrade would otherwise force a wide rewrite.
   - Keep settings defaults, persistence, runtime consumers, and locale strings aligned when settings are touched.
5. Implement the phase.
   - Make the smallest coherent set of edits that completes the phase goal.
   - Keep React and UI modernization in the UI and bridging layers unless the phase explicitly targets `src/js/` core behavior.
   - Do not revert unrelated user changes in a dirty worktree.
6. Validate in increasing cost order.
   - Sweep for leftover old APIs that should be removed by this phase.
   - Run `yarn typecheck`.
   - Run `yarn build`.
   - Run `yarn dev`; use `yarn dev -- --port 8081` if port `8080` is occupied.
   - Smoke test the browser flow that corresponds to the phase.
7. Interpret results.
   - Fix app-owned regressions, warnings, and validation failures introduced by the phase.
   - Treat `ws://localhost:8080/bbs` refusal during local smoke tests as expected when the relay is not running.
   - If a remaining warning comes from a third-party dependency, document it explicitly instead of churning stable app code.
8. Prepare the checkpoint commit.
   - Restore tracked placeholders that build steps may delete, such as `dist/.gitkeep`.
   - Review `git status --short` and confirm only intended files are included.
   - Create one working commit for the phase or checkpoint with a specific conventional commit message.

## Decision Points

- If repository instructions conflict with modernization work, require an explicit user override before breaking the legacy-preservation rule.
- If a file changed during the session, re-read it before editing instead of assuming earlier context is still current.
- If validation fails, fix the concrete failure before moving to the next phase.
- If the build passes but runtime behavior regresses, prioritize smoke-test fixes over more refactoring.
- If a direct library migration is too invasive, ship a bridge first and remove it in a later phase.

## Completion Criteria

- The target phase scope is implemented.
- `yarn typecheck` passes.
- `yarn build` passes.
- A dev smoke test reaches the expected UI boot path for that phase.
- Residual warnings or environment-dependent failures are explained.
- The phase ends in a working commit or an explicitly commit-ready working tree.

## Example Prompts

- `/pttchrome-modernization-phase continue Phase 4 and replace recompose in ContextMenu`
- `/pttchrome-modernization-phase validate Phase 3 before committing`
- `/pttchrome-modernization-phase checkpoint the current React 18 migration`