# CodeShredder

CodeShredder is a fast, safe desktop cleanup app for developers and power users.

It finds laptop junk, code junk, dependency folders, build artifacts, caches, and WSL bloat through a polished Tauri desktop app.

## Simple idea

Developers often lose disk space to generated folders like:

- `node_modules`
- `.next`
- `.nuxt`
- `target`
- `dist`
- `build`
- `.venv`
- `__pycache__`
- `.pytest_cache`
- package manager caches
- WSL virtual disks

CodeShredder scans selected folders, explains what is safe to remove, and moves selected items to Trash by default.

## Audience

CodeShredder is built for:

- developers
- students
- hackathon builders
- JavaScript, TypeScript, Rust, Python, mobile, and web developers
- Windows users with WSL
- macOS developers with many local projects
- anyone whose laptop is full of generated project junk

## Core promise

**Find junk fast. Explain what it is. Delete safely.**

## Core features

- **Shred:** find heavy developer folders like `node_modules`, `.next`, `target`, `dist`, and `.venv`.
- **Caches:** clean package manager and system caches.
- **WSL Optimizer:** clean and compact WSL disks on Windows.
- **Large Files:** discover large videos, archives, installers, logs, and dumps.
- **Duplicates:** detect duplicate files later.
- **Treemap:** visualize disk usage later.

## Documentation

- [PRD](./docs/PRD.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [UI & Frontend](./docs/UI_FRONTEND.md)
- [Roadmap](./docs/ROADMAP.md)
- [Safety & Testing](./docs/SAFETY_TESTING.md)

## First milestone

Build the Shred flow:

1. Scan selected folders.
2. Detect known developer junk.
3. Show reclaimable space.
4. Select folders.
5. Move selected folders to Trash.
6. Save cleanup history.

## Tech direction

CodeShredder will use:

- Tauri v2
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Rust backend
- safe trash-first cleanup
