# AI Collaboration Protocol

This repo may be edited by multiple AI coding tools. Use this file as the shared operating contract.

## Source of Truth

- GitHub is the source of truth.
- Always start by pulling the latest remote state.
- Check `git status --short --branch` before editing.
- Do not overwrite or revert work from another tool unless the user explicitly asks.

## Branching

- Do not do feature or audit work directly on `main`.
- Use scoped branches:
  - `codex/<task-name>` for Codex Desktop work.
  - `claude/<task-name>` for Claude Code work.
- Merge to `main` only after build/test checks pass and the user approves production impact.

## Production Boundary

- Pushes to `main` or `master` can trigger production deployment.
- Treat every merge/push to `main` as a deployment action.
- Documentation-only changes may be ignored by the production workflow, but do not rely on that for safety.

## File Ownership

- Before starting a task, identify the files/modules you expect to touch.
- Avoid concurrent edits to the same files.
- If overlap is unavoidable, commit or stash first, then coordinate through Git history and summaries.

## Commit Rules

- Make atomic commits.
- Use clear commit messages with the actor prefix where useful:
  - `Codex: audit deployment workflow`
  - `Claude: add document category backend`
- Include a short final summary of changed files, verification run, and known risks.

## Verification Baseline

For code changes, prefer at least:

- Backend: `npm run build` from `backend/`
- Frontend: `npm run build` from `frontend-web/`
- Tests/lint where practical before merge.

If a check cannot be run, state why.

## Current Coordination Notes

- Latest observed `main` commit: `763a3e6 Add My HR Documents module with Digital Library and Category Management`.
- Active production workflow: `.github/workflows/deploy-aurorahr.yml`.
- Important caveat: active production workflow currently builds/deploys the frontend only. Backend deployment should be audited before relying on CI/CD for full-stack releases.
