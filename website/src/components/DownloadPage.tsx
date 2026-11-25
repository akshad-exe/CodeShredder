import React, { useState } from 'react';
import { Check, Copy, Download, ExternalLink, ShieldCheck, Terminal, TriangleAlert } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CodeShredderIcon } from './CodeShredderIcon';
import { PLATFORM_ICON } from './DownloadButton';
import { DesktopOnlyNotice } from './DesktopOnlyNotice';
import { ReleaseNote } from './ReleaseNote';
import { platformDownload, siteConfig } from '../config/site';
import { detectPlatform, PLATFORMS, type Platform } from '../lib/platform';

const BUILD_FROM_SOURCE = [
  'git clone https://github.com/akshad-exe/CodeShredder',
  'cd CodeShredder',
  'bun install',
  'bun run tauri:build --no-bundle',
].join('\n');

interface Step {
  title: string;
  body: React.ReactNode;
}

const INSTALL: Record<Platform, Step[]> = {
  Windows: [
    { title: 'Get the installer', body: 'Use the .exe, or the .msi for managed machines.' },
    { title: 'Allow it to run', body: 'If SmartScreen appears, choose “More info”, then “Run anyway”.' },
    { title: 'Start cleaning', body: 'Finish the installer and open CodeShredder from the Start menu.' },
  ],
  macOS: [
    { title: 'Install', body: 'Open the .dmg and drag CodeShredder into Applications.' },
    { title: 'Open it once', body: 'macOS blocks it the first time because the build is not signed.' },
    { title: 'Allow it', body: 'In System Settings → Privacy & Security, choose “Open Anyway”. On older macOS, right-click the app and choose Open.' },
  ],
  // Linux entries are alternatives, one per package format.
  Linux: [
    { title: 'AppImage', body: <>Run <Code>chmod +x CodeShredder_*.AppImage</Code>, then open it. Ubuntu 22.04 and newer may need <Code>libfuse2</Code>.</> },
    { title: 'Debian or Ubuntu', body: <Code>sudo apt install ./CodeShredder_*.deb</Code> },
    { title: 'Fedora', body: <Code>sudo dnf install ./CodeShredder-*.rpm</Code> },
  ],
};

/** The command that prints a file's SHA-256 on each system. */
const HASH: Record<Platform, { command: (file: string) => string; list: string }> = {
  Windows: { command: (f) => `Get-FileHash .\\${f}`, list: 'checksums-windows.sha256' },
  macOS: { command: (f) => `shasum -a 256 ${f}`, list: 'checksums-macos.sha256' },
  Linux: { command: (f) => `sha256sum ${f}`, list: 'checksums-linux.sha256' },
};

const CARD = 'rounded-2xl border border-white/[0.08] bg-panel';

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-xs text-accent [overflow-wrap:anywhere]">{children}</code>;
}

/** A terminal-style block with a copy button. */
function CommandBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});

  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-black">
      <pre className="overflow-x-auto p-3.5 pr-14 font-mono text-xs leading-relaxed text-text/90">{text}</pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy command'}
        className="absolute right-2 top-2 grid h-8 w-8 place-content-center rounded-lg border border-white/10 bg-panel-2 text-muted hover:text-white cursor-pointer"
      >
        {copied ? <Check className="h-4 w-4 text-safe" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** The platform asked for in `?os=`, else the visitor's, else Windows. */
function initialPlatform(detected: Platform | null): Platform {
  const asked = new URLSearchParams(window.location.search).get('os');
  return PLATFORMS.find((p) => p === asked) ?? detected ?? 'Windows';
}

export const DownloadPage: React.FC = () => {
  const [detected] = useState(detectPlatform);
  const [platform, setPlatform] = useState<Platform>(() => initialPlatform(detected));
  const download = platformDownload(platform);
  const [primary, ...others] = download.assets;
  const PlatformIcon = PLATFORM_ICON[platform];
  const numbered = platform !== 'Linux';

  const choose = (p: Platform) => {
    setPlatform(p);
    window.history.replaceState(null, '', `?os=${p}`);
  };

  return (
    <div className="min-h-screen bg-background text-text selection:bg-accent selection:text-white">
      <Navbar />
      <main className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(255,112,43,0.18),transparent)]" />

        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
          <header className="flex flex-col items-center text-center">
            <CodeShredderIcon size={72} glow />
            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-white text-balance">
              Download Code<span className="text-accent">Shredder</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted">Free, open source and no telemetry.</p>
          </header>

          <DesktopOnlyNotice className="mx-auto mt-8 max-w-2xl" />

          <div
            className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-sidebar p-1"
            role="group"
            aria-label="Choose your operating system"
          >
            {PLATFORMS.map((p) => {
              const Icon = PLATFORM_ICON[p];
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={p === platform}
                  onClick={() => choose(p)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                    p === platform ? 'bg-panel-2 text-white shadow-[inset_0_0_0_1px_rgba(255,112,43,0.55)]' : 'text-muted hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {p}
                </button>
              );
            })}
          </div>

          <section className={`${CARD} mx-auto mt-6 max-w-2xl p-6 sm:p-8 text-center shadow-[0_30px_80px_-30px_rgba(255,112,43,0.35)]`}>
            <div className="mx-auto grid h-14 w-14 place-content-center rounded-2xl border border-accent/30 bg-accent/10 text-white">
              <PlatformIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">CodeShredder for {platform}</h2>
            <p className="mt-1 text-sm text-muted">{download.requirements}</p>
            <p className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-white/10 bg-panel-2 px-2.5 py-1 font-mono text-muted">{siteConfig.version}</span>
              {detected === platform && (
                <span className="rounded-full border border-safe/30 bg-safe/10 px-2.5 py-1 text-safe">Matches your system</span>
              )}
            </p>

            <a
              href={primary.url}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-6 py-4 text-base font-bold text-black transition-colors hover:bg-accent/90"
            >
              <Download className="h-5 w-5 shrink-0" />
              <span>Download {primary.label}</span>
              <span className="font-mono text-xs font-semibold text-black/70">{primary.size}</span>
            </a>
            <p className="mt-2 truncate font-mono text-[11px] text-faint">{primary.filename}</p>

            {others.length > 0 && (
              <div className="mt-5 border-t border-white/[0.06] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-faint">Other formats</p>
                <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                  {others.map((asset) => (
                    <a
                      key={asset.filename}
                      href={asset.url}
                      title={asset.filename}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-sidebar px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:border-accent/60"
                    >
                      <Download className="h-3.5 w-3.5 text-accent" />
                      {asset.label}
                      <span className="font-mono text-[11px] text-faint">{asset.size}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="mx-auto mt-4 flex max-w-2xl items-start gap-3 rounded-xl border border-warning/25 bg-warning/[0.07] p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <ReleaseNote />
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <section className={`${CARD} p-5 sm:p-7`}>
              <h2 className="text-lg font-bold text-white">Install on {platform}</h2>
              {!numbered && <p className="mt-1 text-sm text-muted">Pick the line for the file you downloaded.</p>}
              <ol className="mt-5 space-y-5">
                {INSTALL[platform].map((step, i) => (
                  <li key={`${platform}-${step.title}`} className="flex gap-4">
                    <span className="grid h-7 w-7 shrink-0 place-content-center rounded-full border border-accent/40 bg-accent/10 text-xs font-bold text-accent">
                      {numbered ? i + 1 : <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="flex min-w-0 flex-col gap-5">
              <section className={`${CARD} space-y-3 p-5 sm:p-7`}>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <ShieldCheck className="h-5 w-5 text-safe" />
                  Verify your download
                </h2>
                <p className="text-sm leading-relaxed text-muted">
                  The result should match this file’s line in <Code>{HASH[platform].list}</Code> on the release page.
                </p>
                <CommandBlock key={platform} text={HASH[platform].command(primary.filename)} />
                <a
                  href={siteConfig.releasesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-1.5 text-sm font-semibold text-accent hover:text-accent/80"
                >
                  All releases and checksums
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </section>

              <section className={`${CARD} space-y-3 p-5 sm:p-7`}>
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <Terminal className="h-5 w-5 text-accent" />
                  Build from source
                </h2>
                <p className="text-sm text-muted">Needs Rust, Bun and the Tauri system dependencies.</p>
                <CommandBlock text={BUILD_FROM_SOURCE} />
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
