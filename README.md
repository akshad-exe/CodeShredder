<div align="center">

# 🗑️ CodeShredder

**Find junk fast. Explain what it is. Delete safely.**

A fast, safe desktop cleanup app for developers — built with Rust and Tauri v2.

[![CI](https://github.com/akshad-exe/CodeShredder/actions/workflows/ci.yml/badge.svg)](https://github.com/akshad-exe/CodeShredder/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/akshad-exe/CodeShredder?display_name=tag&sort=semver)](https://github.com/akshad-exe/CodeShredder/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-FF702B?style=flat-square)](./LICENSE)
[![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-555?style=flat-square)](#-download)
[![Built with](https://img.shields.io/badge/built%20with-Rust%20%2B%20Tauri%20v2-orange?style=flat-square&logo=rust)](https://tauri.app)

[Website](https://akshad-exe.github.io/CodeShredder/) · [Releases](https://github.com/akshad-exe/CodeShredder/releases) · [Report a Bug](https://github.com/akshad-exe/CodeShredder/issues/new/choose) · [Contribute](CONTRIBUTING.md)

</div>

---

## The Problem

Every developer has folders they can't delete but dare not keep. A single `node_modules` can be 1.2 GB. A `target/` from one Rust build can be 8 GB. Six months of stale virtual environments, framework caches, and abandoned side-projects quietly eat a drive until builds start failing and laptops start thrashing.

Existing cleaners treat your disk like a storage closet. They show you a donut chart of "used space" and leave you to work out which of the 40,000 files is safe to remove. **That's backwards.** You don't want to know what's big — you already know a 9 GB `node_modules` is big. You want to know **which of these folders is junk, why it's junk, and whether it's safe to delete right now.**

## The Approach

CodeShredder scans the folders you point it at and lists **known generated artifacts**, each with its ecosystem, a safety grade (Safe / Medium / Dangerous), its size and when it last changed.

- **Trash-first.** Shred, Large Files, Videos and Duplicates move items to the system Trash. Permanent deletion is an explicit opt-in on Shred.
- **Guard rails in the backend.** The app only deletes paths a scan returned to you, and refuses system directories.
- **Runs locally.** No telemetry, no accounts. The only network request is the update check against GitHub Releases.

<div align="center">

| | |
|:--|:--|
| **39 folder patterns** | `node_modules`, `target`, `.next`, `dist`, `build`, `.venv`, `__pycache__`, `.turbo`, `.parcel-cache`, `zig-out`, `DerivedData` and more (10 on by default) |
| **Global caches** | `npm`, `yarn`, `pnpm`, `bun`, `pip`, `uv`, `cargo`, `go`, `maven`, `gradle`, `nuget`, `composer`, plus system cache folders |
| **Parallel scanning** | `jwalk` + `rayon`, with a snapshot cache that speeds up repeat scans |

</div>

## ✨ Features

| Page | What it does | Platforms |
|:--|:--|:--|
| **Overview** | Reclaimable space and recent cleanups | All |
| **Shred** | Finds generated folders in your projects, grouped by project | All |
| **Caches** | Empties package-manager caches (and temp files on Windows) after you confirm. **Permanent, not Trash.** | All |
| **Large Files** | Biggest files in your scan folders, Videos, Downloads and Desktop | All |
| **Videos** | Video files in the same folders, by size | All |
| **Duplicates** | Identical files, matched by BLAKE3 content hash | All |
| **Recycle Bin** | Restore trashed items, or delete them permanently | Windows, Linux |
| **WSL Optimizer** | Clean distros and compact their virtual disks | Windows |
| **Settings / About** | Scan folders, patterns, ignore rules, delete mode, in-app updates | All |

## 📦 Download

Latest release: [v0.1.2](https://github.com/akshad-exe/CodeShredder/releases/tag/v0.1.2).

<table>
<tr><th align="left">Platform</th><th align="left">Installer</th><th align="left">Size</th><th align="left">Requires</th></tr>
<tr>
<td align="left">🪟 <strong>Windows</strong></td>
<td align="left"><a href="https://github.com/akshad-exe/CodeShredder/releases/download/v0.1.2/CodeShredder_0.1.2_x64_en-US.msi">.msi</a> · <a href="https://github.com/akshad-exe/CodeShredder/releases/download/v0.1.2/CodeShredder_0.1.2_x64-setup.exe">.exe</a></td>
<td align="left">5.8 MB / 4.2 MB</td>
<td align="left">Windows 10/11 (64-bit)</td>
</tr>
<tr>
<td align="left">🍎 <strong>macOS</strong></td>
<td align="left"><a href="https://github.com/akshad-exe/CodeShredder/releases/download/v0.1.2/CodeShredder_0.1.2_universal.dmg">.dmg</a> · <a href="https://github.com/akshad-exe/CodeShredder/releases/download/v0.1.2/CodeShredder_0.1.2_universal.app.tar.gz">.app.tar.gz</a></td>
<td align="left">11.9 MB / 12.0 MB</td>
<td align="left">macOS 12+ (Intel &amp; Apple Silicon)</td>
</tr>
<tr>
<td align="left">🐧 <strong>Linux</strong></td>
<td align="left"><a href="https://github.com/akshad-exe/CodeShredder/releases/download/v0.1.2/CodeShredder_0.1.2_amd64.AppImage">AppImage</a> · <a href="https://github.com/akshad-exe/CodeShredder/releases/download/v0.1.2/CodeShredder_0.1.2_amd64.deb">.deb</a> · <a href="https://github.com/akshad-exe/CodeShredder/releases/download/v0.1.2/CodeShredder-0.1.2-1.x86_64.rpm">.rpm</a></td>
<td align="left">81.4 MB / 7.3 MB / 7.3 MB</td>
<td align="left">glibc 2.35+ (Ubuntu 22.04+), x86_64</td>
</tr>
</table>

Builds are not code-signed, so Windows SmartScreen and macOS Gatekeeper will warn on first launch.

<details>
<summary><b>Verify a download</b></summary>

Compare the hash of your file with the line for it in `checksums-<os>.sha256` from the same release:

```bash
sha256sum CodeShredder_0.1.2_amd64.deb
grep 'amd64.deb$' checksums-linux.sha256
```
</details>

## 🚀 Quick Start

**Prerequisites:** [Rust](https://rustup.rs) (stable), [Bun](https://bun.sh), and the [Tauri v2 system dependencies](https://tauri.app/start/prerequisites/) for your platform.

```bash
git clone https://github.com/akshad-exe/CodeShredder.git
cd CodeShredder
bun install
bun run tauri:dev
```

That launches the desktop app with hot reload.

<details>
<summary><b>Other useful commands</b></summary>

```bash
# Frontend only, in a browser (no native shell)
bun run --filter codeshredder-frontend dev

# Production desktop bundle → src-tauri/target/release/bundle/
bun run tauri:build

# Marketing site → website/dist
cd website && bun install && bun run build

# Lint
bun run lint

# Rust checks
cargo test  --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets
```
</details>

> **Linux build deps** (Debian/Ubuntu): `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev patchelf libayatana-appindicator3-dev xdg-utils`
>
> **Signing:** `bun run tauri:build` produces updater artifacts and needs `TAURI_SIGNING_PRIVATE_KEY`. Without the key, build with:
> `bun run tauri:build --config '{"bundle":{"createUpdaterArtifacts":false}}'`
>
> **WSL Optimizer** compiles only on Windows (`cfg(target_os = "windows")`), so WSL changes need a Windows build to validate.

## 🏗️ Architecture

```
CodeShredder/
├── desktop/              React 19 + TypeScript frontend (Vite, Tailwind, shadcn/ui)
│   └── src/pages/        Overview · Shred · Caches · Wsl · LargeFiles · Videos · Duplicates · RecycleBin · Settings · About
├── src-tauri/            Rust backend (Tauri v2)
│   ├── src/commands/     #[tauri::command] IPC layer — thin, spawns blocking work
│   ├── src/services/     Business logic
│   │   ├── scanner/      discovery · measure · prune · roots · display
│   │   ├── caches.rs     cache specs, dry-run, size accounting
│   │   ├── explore.rs    large-file + video walks
│   │   ├── trash.rs      move-to-trash with restore
│   │   ├── safety.rs     protected-path rules
│   │   └── history.rs    cleanup history
│   ├── src/domain/       entry types + junk pattern definitions
│   └── src/storage/      persistence
└── website/              Marketing site (React + Tailwind v4)
```

**How a Shred scan flows:**

1. A command handler spawns the scan on Tauri's blocking pool.
2. `scanner` normalizes the roots (expands `~/`, drops missing and nested ones) and walks them with `jwalk`, never descending into matched, VCS or protected folders.
3. Matches are measured on a bounded `rayon` pool; a snapshot cache keyed on directory mtimes speeds up repeat scans.
4. Results stream to the UI in batches, and their paths are added to an allow-list.
5. Cleanup refuses any path that is not on the allow-list or is protected, then moves it to Trash (or deletes it, if you chose permanent).

**Releasing:** bump the version in `package.json`, `desktop/package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`, then publish a GitHub release tagged `vX.Y.Z`. `release.yml` builds, signs and uploads the bundles. The in-app updater only sees releases that are **not** marked as pre-release.

## 🧪 Testing

```bash
bun run lint
bun run test
bun run build
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets
```

Rust tests cover path protection, the cleanup allow-list, the cache guard, trash size accounting and WSL output parsing. The frontend has one test, for the duplicate keep-one rule.

## ⚠️ Known limitations

- macOS: items go to Trash, but listing and restoring them in the app is not supported.
- Large Files, Videos and Duplicates scans cannot be cancelled.
- Builds are not code-signed.

[AUDIT.md](AUDIT.md) tracks every known issue and its status.

## 🗺️ Roadmap

- [x] Shred flow — scan, explain, select, trash, history
- [x] Package-manager cache cleaning with dry-run
- [x] Large file explorer
- [x] Duplicate detection via BLAKE3
- [x] WSL cleanup + disk compaction
- [x] Videos page
- [x] In-app updater
- [ ] Scheduled / automatic scans
- [ ] Global "exclude these paths" preferences

## 🤝 Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [AGENTS.md](AGENTS.md) for architecture notes and gotchas.

## 📄 License

[MIT](LICENSE) © 2026 Akshad Jogi

## 🛡️ Safety

CodeShredder deletes files, so be clear about how:

- **Trash by default** for scanned items. **Permanent** for cache cleaning, Recycle Bin purge/empty, and Shred's permanent mode.
- **Backend checks:** only scan-returned paths can be cleaned, and system directories are refused. This is not a per-file filter: Large Files and Duplicates can show files you care about, so read the path before removing it.
- **Local only,** apart from the update check.

If CodeShredder offers to delete something it shouldn't, please [open a safety issue](https://github.com/akshad-exe/CodeShredder/issues/new/choose) — that matters more than almost any other bug.

---

<div align="center">
<sub>Built with Rust &amp; Tauri v2 · <a href="https://akshad-exe.github.io/CodeShredder/">Live site</a> · <a href="https://github.com/akshad-exe/CodeShredder/releases">Releases</a></sub>
</div>