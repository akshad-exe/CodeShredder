import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Loader2,
  Power,
  RotateCcw,
  TerminalSquare,
  Trash2,
} from 'lucide-react'
import { Channel } from '@tauri-apps/api/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isTauri, listWslDistros, wslCompact, wslRunCleanup, wslShutdown } from '@/lib/ipc'
import type { WslDistro, WslProgress } from '@/types/cleanup'
import { formatBytes } from '@/lib/format'
import { toast } from '@/components/ui/sonner'

const DEFAULT_CLEANUP_COMMAND =
  'sudo -n apt-get clean 2>/dev/null; apt-get clean 2>/dev/null; sudo -n dnf clean all 2>/dev/null; dnf clean all 2>/dev/null; true'

type LogEntry = {
  id: number
  time: string
  operation: WslProgress['operation']
  level: WslProgress['level']
  text: string
}

const LEVEL_CLASS: Record<WslProgress['level'], string> = {
  info: 'text-muted',
  success: 'text-safe',
  error: 'text-danger',
}

export function Wsl() {
  const [distros, setDistros] = useState<WslDistro[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<Record<string, 'cleanup' | 'compact'>>({})
  const [shuttingDown, setShuttingDown] = useState(false)
  const [compactTarget, setCompactTarget] = useState<WslDistro | null>(null)
  const [cleanupCommand, setCleanupCommand] = useState(DEFAULT_CLEANUP_COMMAND)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const logId = useRef(0)

  const appendLog = (
    operation: WslProgress['operation'],
    level: WslProgress['level'],
    text: string,
  ) => {
    logId.current += 1
    const entry: LogEntry = {
      id: logId.current,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      operation,
      level,
      text,
    }
    setLogs((prev) => [...prev.slice(-499), entry])
    setActiveStep(text)
  }

  const makeChannel = (
    operation: WslProgress['operation'],
  ): Channel<WslProgress> => {
    const channel = new Channel<WslProgress>()
    channel.onmessage = (msg) => appendLog(operation, msg.level, msg.step)
    return channel
  }

  const clearLogs = () => {
    setLogs([])
    setActiveStep(null)
  }

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  const refresh = async () => {
    if (!isTauri()) {
      setDistros([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setDistros(await listWslDistros())
    } catch (err) {
      console.error('[Wsl] list failed:', err)
      toast.error('Could not list WSL distros', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleShutdown = async () => {
    setShuttingDown(true)
    try {
      await wslShutdown(makeChannel('shutdown'))
      appendLog('shutdown', 'success', 'WSL shut down')
      toast.success('WSL shut down')
    } catch (err) {
      appendLog('shutdown', 'error', err instanceof Error ? err.message : String(err))
      toast.error('WSL shutdown failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setShuttingDown(false)
      setActiveStep(null)
      void refresh()
    }
  }

  const handleCleanup = async (distro: WslDistro) => {
    setBusy((b) => ({ ...b, [distro.name]: 'cleanup' }))
    try {
      const res = await wslRunCleanup(
        distro.name,
        cleanupCommand.trim(),
        makeChannel('cleanup'),
      )
      const output = res.output.trim()
      if (output) appendLog('cleanup', 'info', output)
      if (res.success) {
        toast.success(`Cleanup ran in ${res.distro}`, {
          description: output.slice(0, 400) || 'No output.',
        })
      } else {
        toast.error(`Cleanup failed in ${res.distro}`, {
          description: output.slice(0, 400) || 'No output.',
        })
      }
    } catch (err) {
      appendLog('cleanup', 'error', err instanceof Error ? err.message : String(err))
      toast.error('Cleanup failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy((b) => {
        const next = { ...b }
        delete next[distro.name]
        return next
      })
      setActiveStep(null)
    }
  }

  const handleCompact = async () => {
    if (!compactTarget) return
    const distro = compactTarget
    setCompactTarget(null)
    setBusy((b) => ({ ...b, [distro.name]: 'compact' }))
    try {
      const res = await wslCompact(distro.name, makeChannel('compact'))
      const needsAdmin = /diskpart|elevat|(^|\s)740|denied/i.test(res.error ?? '')
      if (res.error) {
        toast.error(`Could not compact ${res.distro}`, {
          description: `${res.error}${needsAdmin ? ' — approve the administrator prompt, or run the app as administrator.' : ''}`,
        })
      } else if (res.freedBytes != null && res.freedBytes > 0) {
        toast.success(`Freed ${formatBytes(res.freedBytes)} from ${res.distro}`, {
          description: `${formatBytes(res.beforeBytes ?? 0)} → ${formatBytes(res.afterBytes ?? 0)}`,
        })
      } else {
        toast.success(`${res.distro} disk is already compact`)
      }
    } catch (err) {
      appendLog('compact', 'error', err instanceof Error ? err.message : String(err))
      toast.error('Compaction failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy((b) => {
        const next = { ...b }
        delete next[distro.name]
        return next
      })
      setActiveStep(null)
      void refresh()
    }
  }

  const totalDisk = distros.reduce((acc, d) => acc + (d.sizeBytes ?? 0), 0)
  const runningCount = distros.filter((d) => d.state === 'Running').length

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">WSL</h1>
          <p className="mt-1 text-sm text-muted">
            List Windows Subsystem for Linux distros, run in-distro cleanup and
            reclaim space by compacting virtual disks.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={shuttingDown}
            className="btn-secondary"
            onClick={() => void handleShutdown()}
          >
            {shuttingDown ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            Shut down WSL
          </button>
          <button
            type="button"
            disabled={loading}
            className="btn-secondary"
            onClick={() => void refresh()}
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {!isTauri() && (
        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-sm text-muted">
            WSL integration needs the native app — this browser preview can't
            talk to your distros.
          </p>
        </div>
      )}

      {distros.length > 0 && (
        <div className="mt-6 card">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-text">
              {distros.length} {distros.length === 1 ? 'distro' : 'distros'}
              {runningCount > 0 && (
                <span className="ml-2 font-normal text-muted">
                  {runningCount} running
                </span>
              )}
            </p>
            <span className="text-xs text-faint">·</span>
            <span className="text-sm tabular-nums text-muted">
              {totalDisk > 0 ? formatBytes(totalDisk) : 'no disk found'}
            </span>
          </div>
        </div>
      )}

      {/* Cleanup command editor */}
      <section className="card mt-4 space-y-2">
        <header>
          <h2 className="text-sm font-semibold text-text">In-distro cleanup command</h2>
          <p className="text-xs text-muted">
            A shell snippet run with your distro's default user via{' '}
            <span className="font-mono text-faint">bash -lc</span>. Safe defaults
            clear package-manager caches; adjust to taste.
          </p>
        </header>
        <textarea
          value={cleanupCommand}
          onChange={(e) => setCleanupCommand(e.target.value)}
          rows={3}
          spellCheck={false}
          className="w-full resize-y rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs text-text outline-none transition-colors placeholder:text-faint focus:border-accent"
        />
      </section>

      {loading ? (
        <div className="mt-4 space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-panel"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      ) : distros.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-border bg-panel px-4 py-16 text-center">
          <div>
            <TerminalSquare className="mx-auto h-10 w-10 text-faint" />
            <p className="mt-4 text-sm font-medium text-text">No distros found</p>
            <p className="mt-1 text-xs text-muted">
              Install a distro from the Windows Store or check that WSL is
              enabled, then refresh.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {distros.map((distro) => {
            const action = busy[distro.name]
            const running = distro.state === 'Running'
            return (
              <div
                key={distro.name}
                className="flex items-center gap-4 rounded-lg border border-border bg-panel px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="truncate text-sm font-semibold text-text">
                      {distro.name}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        running
                          ? 'bg-safe/10 text-safe'
                          : 'bg-panel-2 text-muted'
                      }`}
                    >
                      {running && (
                        <span className="h-1.5 w-1.5 rounded-full bg-safe" />
                      )}
                      {distro.state}
                    </span>
                  </div>
                  <div className="mt-1 truncate font-mono text-[11px] leading-tight text-faint">
                    {distro.vhdxPath ? (
                      <span title={distro.vhdxPath}>{distro.vhdxPath}</span>
                    ) : (
                      <span>virtual disk not found</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pl-3 text-right">
                  <p className="text-sm font-semibold tabular-nums text-text">
                    {distro.sizeBytes != null ? formatBytes(distro.sizeBytes) : '—'}
                  </p>
                  <p className="text-[11px] text-faint">disk size</p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={action != null}
                    className="btn-ghost !px-2.5 !py-1.5 text-xs text-muted hover:text-text"
                    onClick={() => void handleCleanup(distro)}
                  >
                    {action === 'cleanup' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Clean up
                  </button>
                  <button
                    type="button"
                    disabled={action != null}
                    className="btn-secondary !px-2.5 !py-1.5 !text-xs"
                    onClick={() => setCompactTarget(distro)}
                  >
                    {action === 'compact' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <HardDrive className="h-3.5 w-3.5" />
                    )}
                    Compact
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Live operation log */}
      <section className="card mt-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text">Operation log</h2>
            <p className="text-xs text-muted">
              Live progress streamed back from <span className="font-mono text-faint">wsl.exe</span>{' '}
              and <span className="font-mono text-faint">diskpart</span>.
            </p>
          </div>
          <button
            type="button"
            disabled={logs.length === 0}
            className="btn-ghost !px-2.5 !py-1.5 text-xs text-muted hover:text-text"
            onClick={clearLogs}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </header>

        {activeStep && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
            <p className="min-w-0 truncate text-xs font-medium text-text">{activeStep}</p>
          </div>
        )}

        <div
          ref={logRef}
          className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed"
        >
          {logs.length === 0 ? (
            <p className="py-4 text-center text-faint">
              No operations yet — run a cleanup, compact or shutdown to see progress here.
            </p>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="break-words whitespace-pre-wrap">
                <span className="text-faint">[{entry.time}]</span>{' '}
                <span className={LEVEL_CLASS[entry.level]}>{entry.text}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <Dialog open={compactTarget != null} onOpenChange={(o) => !o && setCompactTarget(null)}>
        <DialogContent className="max-w-md border-border bg-panel">
          <DialogHeader>
            <div className="mb-2 grid h-10 w-10 place-content-center rounded-full bg-warning/10 text-warning">
              <HardDrive className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base text-text">
              Compact {compactTarget?.name}?
            </DialogTitle>
            <DialogDescription className="text-muted">
              This <span className="font-medium text-text">shuts down all WSL distros</span>{' '}
              and shrinks {compactTarget?.name}'s virtual disk. If Windows holds the
              disk locked, an{' '}
              <span className="font-medium text-text">administrator approval prompt</span>{' '}
              will appear — approve it to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCompactTarget(null)}
            >
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={() => void handleCompact()}>
              Compact disk
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
