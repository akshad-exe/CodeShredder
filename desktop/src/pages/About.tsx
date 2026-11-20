import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from '@/lib/ipc'
import { checkForUpdate, installUpdate } from '@/lib/updater'
import type { Update } from '@tauri-apps/plugin-updater'

const REPO = 'https://github.com/akshad-exe/CodeShredder'
const LINKS = [
  { label: 'GitHub repository', url: REPO },
  { label: 'Release notes', url: `${REPO}/releases` },
  { label: 'Report an issue', url: `${REPO}/issues` },
  { label: 'Website', url: 'https://akshad-exe.github.io/CodeShredder/' },
]

export function About() {
  const [version, setVersion] = useState('')
  const [update, setUpdate] = useState<Update | null>(null)
  const [status, setStatus] = useState<'idle' | 'checking' | 'current' | 'installing' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  const onCheck = async () => {
    setStatus('checking')
    try {
      const found = await checkForUpdate()
      setUpdate(found)
      setStatus(found ? 'idle' : 'current')
    } catch {
      setStatus('error')
    }
  }

  const onInstall = async () => {
    if (!update) return
    setStatus('installing')
    try {
      await installUpdate(update, setProgress)
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    if (isTauri()) getVersion().then(setVersion).catch(() => {})
  }, [])

  const open = (url: string) =>
    isTauri() ? openUrl(url).catch(() => {}) : window.open(url, '_blank', 'noopener')

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <h1 className="text-2xl font-bold text-text">About</h1>
      <p className="mt-1 text-sm text-muted">What CodeShredder is and where to find help.</p>

      <div className="mt-6 max-w-2xl space-y-4">
        <section className="rounded-xl border border-border bg-panel p-5">
          <div className="flex items-center gap-4">
            <img src="/favicon.svg" alt="" className="h-12 w-12" />
            <div>
              <div className="text-lg font-bold text-text">CodeShredder</div>
              <div className="font-mono text-xs text-muted">
                {version ? `Version ${version}` : 'Development build'} · Tauri 2 + Rust
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            A fast, safe cleanup app for developers. It finds heavy generated folders, caches, WSL
            bloat, large files and duplicates, then moves what you pick to the Trash.
          </p>
          <p className="mt-3 flex items-start gap-2 text-sm text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
            Everything runs locally. No accounts, analytics or network calls.
          </p>
        </section>

        {isTauri() && (
          <section className="rounded-xl border border-border bg-panel p-5">
            <h2 className="text-sm font-semibold text-text">Updates</h2>
            <p className="mt-1 text-sm text-muted">
              {update
                ? `Version ${update.version} is available.`
                : status === 'current'
                  ? 'You are on the latest version.'
                  : status === 'error'
                    ? 'Could not reach the update server. Try again later.'
                    : 'Check whether a newer version is available.'}
            </p>
            <div className="mt-3">
              {update ? (
                <button
                  type="button"
                  onClick={onInstall}
                  disabled={status === 'installing'}
                  className="btn-primary !text-xs !text-black"
                >
                  {status === 'installing' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Installing{progress ? ` ${progress}%` : '…'}
                    </>
                  ) : (
                    'Install and restart'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCheck}
                  disabled={status === 'checking'}
                  className="btn-secondary !text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
                  Check for updates
                </button>
              )}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-border bg-panel p-5">
          <h2 className="text-sm font-semibold text-text">Links</h2>
          <ul className="mt-3 space-y-1">
            {LINKS.map((l) => (
              <li key={l.url}>
                <button
                  type="button"
                  onClick={() => open(l.url)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text hover:bg-panel-2"
                >
                  {l.label}
                  <ExternalLink className="h-3.5 w-3.5 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p className="px-1 text-xs text-faint">Released under the MIT License.</p>
      </div>
    </div>
  )
}
