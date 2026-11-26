# Contributing to CodeShredder

Thanks for considering a contribution. CodeShredder deletes files, so changes get reviewed a little more carefully than most — the bar is "is this provably safe?" rather than "does it work?".

## Getting set up

```bash
git clone https://github.com/akshad-exe/CodeShredder.git
cd CodeShredder
bun install
bun run tauri:dev
```

You need [Rust](https://rustup.rs) (stable), [Bun](https://bun.sh), and the [Tauri v2 system dependencies](https://tauri.app/start/prerequisites/).

On Linux:

```bash
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev patchelf libayatana-appindicator3-dev xdg-utils
```

## Before you open a PR

These are what CI runs:

```bash
bun run lint
bun run test
bun run build
(cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test)
```

If you touch the website: `cd website && bun install && bun run build`.

New here? Look for [`good first issue`](https://github.com/akshad-exe/CodeShredder/labels/good%20first%20issue),
or pick from the "Still open" list in [AUDIT.md](AUDIT.md). Everyone follows the
[Code of Conduct](CODE_OF_CONDUCT.md); report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## Where things live

| Path | What's in it |
|---|---|
| `desktop/src/pages/` | One file per screen |
| `desktop/src/lib/ipc.ts` | All Tauri IPC wrappers — the frontend's only door to Rust |
| `src-tauri/src/commands/` | `#[tauri::command]` handlers; thin, they delegate to services |
| `src-tauri/src/services/` | Business logic — scanning, caching, trashing, safety |
| `src-tauri/src/domain/` | Shared types and junk-pattern definitions |
| `AGENTS.md` | Architecture notes and platform gotchas — **read this** |

## Things that will complicate your PR

**WSL code only compiles on Windows.** Anything under `cfg(target_os = "windows")` is not type-checked on Linux or macOS, so a change there cannot be validated until someone builds on Windows. Say so in the PR description.

**Don't add a page or a Tauri command without following the existing shape.** Commands are thin and hand work to `spawn_blocking`; services do the real work and return typed errors via `thiserror`. Frontend talks to Rust only through `lib/ipc.ts`.

**The safety layer is not negotiable.** Anything that decides what is *deletable* belongs in `services/safety.rs`, and it needs a unit test. UI-level hiding is not a safety mechanism.

**Avoid `unwrap()` in production code.** Use `?` with a typed error, or `expect()` with a message when the invariant truly can't hold. `unwrap()` is fine in tests.

## Reporting bugs

Use the [issue forms](https://github.com/akshad-exe/CodeShredder/issues/new/choose). If the bug involves data loss, use the safety form.

## Pull requests

- One logical change per PR — split unrelated cleanups out.
- Match the surrounding code style rather than reformatting files you didn't otherwise touch.
- Write a commit message that explains *why*.
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, with an optional scope, e.g. `fix(scanner): skip nested node_modules`.