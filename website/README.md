# CodeShredder Website

The official promotional website for CodeShredder, deployed to GitHub Pages.

## Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS** + shadcn/ui
- **React Router** (BrowserRouter for clean URLs)
- **lucide-react** icons

## Structure

```
website/
├── src/
│   ├── components/
│   │   ├── layout/       # Header, Footer
│   │   ├── sections/     # Hero, Features, Stats, CTA
│   │   └── ui/           # shadcn/ui components
│   ├── lib/utils.ts      # cn() helper
│   ├── pages/
│   │   ├── HomePage.tsx      # Landing page
│   │   └── DownloadPage.tsx  # OS-aware download page
│   ├── App.tsx            # Router setup
│   └── index.css          # Tailwind + theme
├── components.json        # shadcn config
├── tailwind.config.ts
└── vite.config.ts         # base: /CodeShredder/
```

## Development

```sh
bun install
bun run dev        # local dev server
bun run build      # production build
bun run preview    # preview build
```

## Deployment

Pushed automatically to GitHub Pages via `.github/workflows/deploy-website.yml`
whenever files under `website/` change on `main`.

Live URL: `https://akshad-exe.github.io/` (or your custom domain)
(deployed at the repo site / custom domain root)

## Download Page

The `/download` page:

- **Auto-detects** the user's OS via `navigator.userAgent`
- Shows **recommended installer** for the detected OS
- Links **directly** to GitHub release asset URLs — GitHub serves these with
  `Content-Disposition: attachment`, so the file downloads immediately on click
- Fetches the **latest release tag** from the GitHub API
- Provides **SHA-256 checksums** for verification

## Notes

- Served at the **root path** (no `/CodeShredder/` prefix) so it works on a
  custom domain or GitHub Pages user site. Vite `base` is unset.
- Uses **BrowserRouter** for clean URLs (e.g. `/download`).
  For a GitHub Pages *project* site you'd need a `404.html` fallback so deep
  links don't 404 — but serving at root doesn't need it.
- The download links point to the `v0.1.0-beta.1` release. Update the
  `RELEASE_BASE` constant in `DownloadPage.tsx` when publishing new releases.
