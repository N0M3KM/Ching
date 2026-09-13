# Git history repair — 2026-09-13

## Cause

The workspace was initialized locally with root commit `1d4d9bd` before the GitHub remote was configured. GitHub already had a separate initial `main` commit, `59668c1`. The feature chain therefore shared history internally but had no common ancestor with `main`.

## Repair

Existing commits were preserved using merge commits, without rebasing or force-pushing:

- `62b09e8`: merged `origin/main` into `feat/contracts-and-static-content` with `--allow-unrelated-histories`. The only conflict was README.md; both descriptions were preserved.
- `c9c96d8`: merged the repaired foundation into `feat/nest-content-api`.
- `9f6e44a`: merged the repaired API branch into `feat/course-flow-and-local-progress`, preserving saved UI commit `227d158`.

All three branches were pushed atomically with ordinary fast-forward remote updates. `main` was unchanged.

## Verification

For each branch, `git merge-base origin/main <branch>` returned `59668c1cd4c5ac10bc457ba4835515c1deedb188`. `git merge-base --is-ancestor` and `git merge-tree --write-tree` both exited zero. This confirmed a shared ancestor and a conflict-free simulated merge into the then-current main.

Always fetch and inspect the remote before creating project history. New independent features should branch from current main; dependent work may use an explicitly chosen feature parent.
