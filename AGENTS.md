# CodeShredder — Agent Guide

## Project

CodeShredder is a fast, safe desktop cleanup app for developers and power users: finds heavy generated folders (`node_modules`, `target`, `.next`, `dist`, `build`, `.venv`, caches), WSL bloat, large files, and duplicates; moves selected items to Trash by default.

**Stack:** Tauri v2 · React 19 + TypeScript + Vite (frontend in `desktop/`) · Rust backend (`src-tauri/`) · Tailwind CSS · shadcn/ui · Zustand · sonner toasts. Bun is the package manager (root `package.json` workspaces → `desktop/`).

**Repo:** `git@github.com:akshad-exe/CodeShredder.git` (private). Commits follow Conventional Commits; one logical unit per commit; never `git add .` blindly.

### Layout

- `desktop/src/pages/` — `Overview`, `Shred`, `RecycleBin`, `Caches`, `Wsl`, `LargeFiles`, `Duplicates`, `Videos`, `Settings`. Routing is a simple `useState<PageId>` switch in `App.tsx` (see `desktop/src/lib/navigation.ts`).
- `desktop/src/lib/ipc.ts` — all Tauri IPC wrappers; `types/cleanup.ts` — shared entry types incl. `WslProgress`.
- `src-tauri/src/commands/` — Tauri command layer (`#[tauri::command]`).
- `src-tauri/src/services/` — business logic (`wsl.rs`, `caches.rs`, `scanner.rs`, `trash.rs`, `safety.rs`, `history.rs`).
- `src-tauri/src/domain/`, `storage/`, `platform/`, `error.rs`, `state.rs`, `app.rs`.

## CodeGraph (IMPORTANT — WSL /mnt workaround)

CodeGraph's index is **NOT** in the repo on disk. On this WSL2 setup, `/mnt/e` is a drvfs/9p mount where SQLite WAL fails with `disk I/O error` (the in-repo `.codegraph/` approach does not work here).

The working setup is a **symlink** from the repo to the native ext4 filesystem:

```sh
ln -s ~/.codegraph/projects/codeshredder .codegraph
```

The real DB lives at `~/.codegraph/projects/codeshredder/codegraph.db` (native WSL disk, no disk-I/O errors). `codegraph` resolves `.codegraph/` in-tree and follows the symlink, so everything works transparently.

- If `.codegraph` is missing/regular dir: it's a plain directory (not the symlink) — remove it and recreate the symlink, then `codegraph index`.
- To update the index after code changes: `codegraph sync` (incremental) or `codegraph index` (full rebuild). Rebuild is fast (~13s).
- `CODEGRAPH_DIR` env override is NOT usable here — it must be a plain directory name inside the project root (no paths), so it cannot point to home.
- The MCP `codegraph_explore` tool queries via `projectPath` = repo root; it needs the `.codegraph` symlink present.

## Dev commands

```sh
npm run build          # frontend: tsc -b && vite build (~2-3 min)
npm run lint           # oxlint (baseline: 4 pre-existing warnings — don't add more)
bun dev                # vite dev server
npm run tauri:dev      # full Tauri dev (Windows needed for WSL features)
```

Backend verification (Ubuntu): Tauri needs its system build deps installed first —
`sudo apt install libgirepository1.0-dev libgtk-3-dev libwebkit2gtk-4.1-dev` (plus
`libsoup-3.0-dev` if webkit needs it). Then verify directly in `src-tauri/`:

```sh
cargo check          # fast typecheck
cargo clippy --all-targets -- -D warnings
cargo test           # unit tests
```

`target_os = "windows"`-gated code (e.g. `runas`/diskpart in WSL commands) still
only compiles when building on Windows, so Windows-only changes need a Windows
build to validate. `runas` 1.2 has no `.output()`, only `.status()`; success = exit code 0.

## Gotchas

- **Windows-only code is NOT compiled on Ubuntu** (cfg'd `target_os = "windows"`), so compile errors there (e.g. `runas::Command::args` vs `.args(&[...])`) only surface when building on Windows. `runas` 1.2 has no `.output()`, only `.status()`; success = exit code 0.
- WSL compact auto-elevates the diskpart step via `runas` (UAC prompt). Freed bytes are verified by before/after vhdx size.
- Frontend checkbox preference: raw accent checkboxes (`<input type="checkbox" ... accent-[var(--accent)] />`) — do NOT reintroduce shadcn `Checkbox`. Treemap was removed — do not re-add.
- Scrollbars are hidden app-wide via the `.no-scrollbar` utility (`index.css`); scrolling still works.
