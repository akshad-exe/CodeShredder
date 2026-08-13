import { useState } from 'react'
import { FolderOpen, Plus, RotateCcw, X } from 'lucide-react'
import { open } from '@tauri-apps/plugin-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { PatternPills } from '@/components/shred/PatternPills'
import { DeleteModeSelect } from '@/components/shred/DeleteModeSelect'
import { useCleanupStore } from '@/store/cleanupStore'

export function Settings() {
  const scanRoots = useCleanupStore((s) => s.scanRoots)
  const addScanRoot = useCleanupStore((s) => s.addScanRoot)
  const removeScanRoot = useCleanupStore((s) => s.removeScanRoot)
  const populateDefaultRoots = useCleanupStore((s) => s.populateDefaultRoots)
  const settings = useCleanupStore((s) => s.settings)
  const setSettings = useCleanupStore((s) => s.setSettings)

  const [ignoreDraft, setIgnoreDraft] = useState('')

  const handleAddFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: true,
      title: 'Select folders to scan',
    })
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected]
      paths.forEach((p) => addScanRoot(p))
    }
  }

  const addIgnoreRule = () => {
    const rule = ignoreDraft.trim()
    if (!rule) return
    if (!settings.ignoreRules.includes(rule)) {
      setSettings({ ignoreRules: [...settings.ignoreRules, rule] })
    }
    setIgnoreDraft('')
  }

  const removeIgnoreRule = (rule: string) => {
    setSettings({ ignoreRules: settings.ignoreRules.filter((r) => r !== rule) })
  }

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Control scan roots, enabled patterns, ignored folders and deletion
            behavior.
          </p>
        </div>
        <button
          type="button"
          onClick={populateDefaultRoots}
          className="btn-secondary !text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Add default folders
        </button>
      </div>

      <div className="mt-8 space-y-6">
        {/* Scan folders */}
        <section className="card space-y-3">
          <header>
            <h2 className="text-sm font-semibold text-text">Scan folders</h2>
            <p className="text-xs text-muted">
              Folders searched for developer junk. Defaults include the common
              dev directories under your home.
            </p>
          </header>

          <div className="space-y-2">
            {scanRoots.length === 0 && (
              <p className="rounded-lg border border-dashed border-border bg-background/60 px-4 py-3 text-xs text-faint">
                No folders yet — add some, or use “Add default folders” above.
              </p>
            )}
            {scanRoots.map((root) => (
              <div
                key={root}
                className="flex items-center gap-2 rounded-lg border border-border bg-panel-2/60 px-3 py-2"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-safe" />
                <span className="flex-1 truncate font-mono text-xs text-text">
                  {root}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${root}`}
                  onClick={() => removeScanRoot(root)}
                  className="text-faint transition-colors hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={handleAddFolder} className="btn-secondary">
            <FolderOpen className="h-4 w-4" />
            Add folder…
          </button>
        </section>

        {/* Scan patterns */}
        <section className="card space-y-3">
          <header>
            <h2 className="text-sm font-semibold text-text">Scan patterns</h2>
            <p className="text-xs text-muted">
              Which folder names the scanner hunts for. These same toggles also
              live on the Shred page.
            </p>
          </header>
          <PatternPills />
        </section>

        {/* Ignore rules */}
        <section className="card space-y-3">
          <header>
            <h2 className="text-sm font-semibold text-text">Ignore rules</h2>
            <p className="text-xs text-muted">
              Folders the scan should skip entirely. A plain name matches any
              folder with that name; a rule containing a path separator matches
              that path fragment (e.g. <span className="font-mono text-faint">node_modules</span>{' '}
              or <span className="font-mono text-faint">build-output/</span>).
            </p>
          </header>

          <div className="flex flex-wrap gap-1.5">
            {settings.ignoreRules.length === 0 && (
              <span className="text-xs text-faint">No rules yet.</span>
            )}
            {settings.ignoreRules.map((rule) => (
              <span
                key={rule}
                className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 font-mono text-xs text-muted"
              >
                {rule}
                <button
                  type="button"
                  aria-label={`Remove ignore rule ${rule}`}
                  onClick={() => removeIgnoreRule(rule)}
                  className="text-faint transition-colors hover:text-danger"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={ignoreDraft}
              onChange={(e) => setIgnoreDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addIgnoreRule()
                }
              }}
              placeholder="Add a folder name or path fragment…"
              className="font-mono text-xs"
            />
            <button
              type="button"
              onClick={addIgnoreRule}
              className="btn-secondary shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </section>

        {/* Cleanup behavior */}
        <section className="card space-y-4">
          <header>
            <h2 className="text-sm font-semibold text-text">Cleanup behavior</h2>
            <p className="text-xs text-muted">
              How deletions run and how much confirmation is required.
            </p>
          </header>

          <DeleteModeSelect />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">
              Confirmations
            </p>
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={settings.confirmDangerous}
                onCheckedChange={(checked) =>
                  setSettings({ confirmDangerous: checked === true })
                }
              />
              <span className="text-sm text-text">
                Ask before deleting folders flagged{' '}
                <span className="font-medium text-warning">dangerous</span>
                <span className="mt-0.5 block text-xs text-muted">
                  Unknown or review-worthy targets require a warning before the
                  Trash move.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={settings.confirmMedium}
                onCheckedChange={(checked) =>
                  setSettings({ confirmMedium: checked === true })
                }
              />
              <span className="text-sm text-text">
                Ask before deleting folders flagged{' '}
                <span className="font-medium text-warning">medium</span>
                <span className="mt-0.5 block text-xs text-muted">
                  Targets that need setup to restore (virtual environments,
                  pod specs).
                </span>
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
