# CodeShredder audit

Audit of the app, release pipeline and CI, November 2026. "Fixed" means changed in code.
Windows and macOS behaviour is **not** verified until CI and a manual run on those systems.

## Principles applied

- **Irreversible actions ask first.** Anything that skips the Trash names what is lost and needs a second click.
- **The backend is the guard.** Path rules live in Rust and have tests; UI checks are a second layer.
- **Never report success that did not happen.** Rows that failed to delete stay on screen.
- **Orange is for action.** It marks primary buttons; sidebar tints identify pages.
- **Show only what works here.** Platform-specific pages and wording follow the OS.
- **Fast feedback in CI.** Cheap checks on every PR, slow bundles only on `main`.

## Data loss and broken features

| # | Issue | Fix | Status |
|:--|:--|:--|:--|
| 1 | Windows refused to clean every cache under `AppData` or `C:\Windows` | Cache guard allows folders two or more levels inside `AppData`. Removed the Windows temp, Update and Prefetch entries, which need admin and never worked | Fixed |
| 2 | A cache env var pointing at home (or `/`) would permanently empty it | Guard refuses the root, home and its parents | Fixed |
| 3 | "User temp files" emptied the shared `/tmp` on Linux and macOS | Entry exists on Windows only | Fixed |
| 4 | Cache cleaning, Trash purge and Empty ran on one click | Confirmation dialog | Fixed |
| 5 | Duplicates could trash every copy of a file | At least one copy per group must remain (UI check) | Fixed, UI only |
| 6 | Windows `\\?\` paths slipped past system-folder protection | Plain paths via `dunce`; guard strips the prefix; filesystem roots protected | Fixed |

## Bugs

| # | Issue | Fix | Status |
|:--|:--|:--|:--|
| 7 | Leaving Shred during a scan left it stuck on "scanning" | Scan events and watchdog live at app level | Fixed |
| 8 | Removed default scan folders came back | Defaults are added once; the Settings button re-adds them | Fixed |
| 9 | Failed deletions disappeared from Shred and Duplicates | Failed rows stay listed | Fixed |
| 10 | "Reveal in folder" on Trash only refreshed | Replaced with a header Refresh button | Fixed |
| 11 | Trash commands ran on the main thread | Run on the blocking pool | Fixed |
| 12 | A slow duplicate scan could overwrite newer results | Only the latest scan writes results | Fixed |
| 26 | `~/` folders never resolved on Windows (`HOME` is unset) | Uses `USERPROFILE` there | Fixed |
| 27 | The `uv` entry on Windows targeted all of `uv`'s folder | Targets `uv/cache` | Fixed |
| 28 | Empty files were reported as duplicates | Skipped | Fixed |
| 29 | Package-manager folders and Python venvs graded "dangerous" | Graded "medium" | Fixed |

## Design

| # | Issue | Fix | Status |
|:--|:--|:--|:--|
| 17 | Sidebar showed a generic lightning icon | Project logo | Fixed |
| 18 | Pattern chips pushed Shred results off screen | Collapsed behind "Patterns · N enabled" | Fixed |
| 19 | Floating action bar covered content | Bottom padding so the last rows can scroll clear. It still floats over content mid-scroll | Partly |
| 20 | Two chips both labelled "Zig" | "Zig output" and "Zig cache" | Fixed |
| 21 | Overview was sparse and could not start a scan | Summary card with "Scan now", tool shortcuts and biggest folders | Fixed |
| 22 | Every scan folder showed a green dot | Missing folders are greyed and marked "not found" | Fixed |
| 23 | Ten sidebar colours competed with the accent | Tried neutral icons, then restored the colours by owner preference | Kept as is |
| 24 | About claimed "no network calls" | States the update check | Fixed |
| 25 | "Recycle Bin" and WSL shown on every OS | "Trash" outside Windows; WSL only on Windows; macOS explains Trash limits | Fixed |
| 32 | Scrolling Shred results showed a blank gap | The virtualizer accounts for the content above the list | Fixed |
| 33 | Category totals gave no detail | Hover or focus shows the five biggest folders | Added |
| 34 | Scans and cache sizes could silently come back empty when the shared thread pool was busy | Folder walks use their own threads; covered by a test | Fixed |

## Release, dependencies and CI

| # | Issue | Fix | Status |
|:--|:--|:--|:--|
| 13 | In-app updater had nothing to find | v0.1.2 is a full release with `latest.json` for all three platforms. Updating from one version to the next is untested | Fixed |
| 14 | Website build-from-source command needed the signing key | Uses `--no-bundle` | Fixed |
| 15 | Website claimed glibc 2.31 | 2.35 | Fixed |
| 16 | Unused plugins and crates | Removed `fs`, `shell`, `os` plugins and `tokio`, `walkdir`, `ignore`, `futures`, `serde_with`, `sysinfo`, `winapi`, `wmi` as direct dependencies | Fixed |
| 30 | Release only checked one version file | Checks all four | Fixed |
| 35 | macOS release build failed: the bundler tried to ship the `scan_bench` developer tool | Moved to `examples/`; CI builds macOS universal like the release | Fixed |
| 36 | Linux and macOS checksum files listed internal bundle files, and the macOS archive under the wrong name | The release hashes only installers, under their download names | Fixed from the next release |
| 31 | CI built three bundles on every PR, floated the Bun version, never tested on Windows, never built the website, allowed warnings and unformatted code | See below | Fixed |

CI now: skips docs-only changes; read-only token; pinned Bun (`packageManager`); lint, frontend tests,
app and website builds; `cargo fmt --check` and `clippy -D warnings` on Linux; `cargo test --locked`
on Linux and Windows; bundles only outside pull requests; caches saved from `main`; job timeouts;
7-day artifact retention.

## Website

| # | Issue | Fix | Status |
|:--|:--|:--|:--|
| W1 | Downloads pointed to the old pre-release | Point at v0.1.2 | Fixed |
| W2 | Mobile header cut off | Header Download button hidden on narrow phones | Fixed |
| W3 | Privacy text ignored the update check | Reworded | Fixed |
| W4 | Docker listed as supported | Removed | Fixed |
| W5, W10 | The interactive app preview differed from the app | Rebuilt to match the current pages, with a caption; spacing reduced | Fixed |
| W6-W8 | Privacy, Contribute and Roadmap links went to the wrong place | Point at the right targets | Fixed |
| W9 | No warning that builds are unsigned | Added beside the download buttons | Fixed |
| W11-W13 | Stuck highlight, cut-off label, wordy hero, unlabelled example figures | Corrected | Fixed |
| W14 | 1.4 MB of background images | WebP, 86 KB | Fixed |
| W15 | Fonts loaded from Google | Served with the site | Fixed |
| W16 | Privacy pop-up lacked Escape and dialog semantics | Native `<dialog>` | Fixed |
| W17 | Small tap targets | At least 24px tall | Fixed |
| W18 | Tablet header overflowed; phone layouts were cramped | Menu below 1024px; reflowed grids, hero, footer and preview; phones are told the app is desktop-only | Fixed |
| W19 | Download buttons fetched a file immediately, with no install help | Dedicated `download.html` with platform tabs, install steps and checksums | Added |

The preview in `DesktopAppShowcase.tsx` is a hand-built copy; update it when an app page changes.

## Still open

| Issue | Suggested next step |
|:--|:--|
| The backend does not enforce "keep one duplicate" | Pass groups to cleanup and check in Rust |
| Large Files, Videos and Duplicates scans cannot be cancelled | Share the Shred cancel token per scan |
| One global cancel flag for all scans | Per-scan token |
| Hard links count as duplicates and free no space | Compare file identity before hashing |
| A cache env var pointing at a personal folder (for example `~/Documents`) is still accepted | Require a cache marker or an allow-list; the dialog now shows the name and size, not the path |
| `build`, `dist`, `out` and `vendor` can hold hand-written files | Check for a project manifest before grading Safe |
| Scan results are lost on restart | Persist the last summary |
| WSL cleanup runs an editable shell command | Confirm before running a changed command |
| Builds are not code-signed | Apple and Windows signing certificates |
| Frontend has one unit test | Cover the store and cleanup hooks |
