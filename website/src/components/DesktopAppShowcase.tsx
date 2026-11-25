import React, { useState } from 'react';
import {
  ArchiveRestore, ArrowRight, Check, ChevronDown, Clock3, Copy, ExternalLink, Film, FolderGit2,
  FolderOpen, FolderX, HardDrive, Info, LayoutDashboard, Minus, Plus, Recycle, RotateCcw,
  Search, Settings, ShieldCheck, Terminal, Trash2, X, Zap,
} from 'lucide-react';
import { CodeShredderIcon } from './CodeShredderIcon';
import { siteConfig } from '../config/site';

// A hand-built copy of the desktop app (Windows build, sample data).
// shortcut: duplicates desktop/src by hand; update it when a page there changes.

type TabId = 'overview' | 'shred' | 'recycle' | 'caches' | 'duplicates' | 'videos' | 'large_files' | 'wsl' | 'settings' | 'about';

const NAV: { label?: string; items: { id: TabId; label: string; icon: typeof Trash2; tone: string }[] }[] = [
  { items: [{ id: 'overview', label: 'Overview', icon: LayoutDashboard, tone: 'bg-accent/10 text-accent' }] },
  { label: 'Reclaim', items: [
    { id: 'shred', label: 'Shred', icon: Trash2, tone: 'bg-rose-500/10 text-rose-400' },
    { id: 'recycle', label: 'Recycle Bin', icon: Recycle, tone: 'bg-emerald-500/10 text-emerald-400' },
    { id: 'caches', label: 'Caches', icon: FolderX, tone: 'bg-amber-500/10 text-amber-400' },
    { id: 'duplicates', label: 'Duplicates', icon: Copy, tone: 'bg-violet-500/10 text-violet-400' },
  ] },
  { label: 'Discover', items: [
    { id: 'videos', label: 'Videos', icon: Film, tone: 'bg-pink-500/10 text-pink-400' },
    { id: 'large_files', label: 'Large Files', icon: HardDrive, tone: 'bg-cyan-500/10 text-cyan-400' },
  ] },
  { label: 'System', items: [
    { id: 'wsl', label: 'WSL', icon: Terminal, tone: 'bg-indigo-500/10 text-indigo-400' },
    { id: 'settings', label: 'Settings', icon: Settings, tone: 'bg-slate-500/10 text-slate-300' },
    { id: 'about', label: 'About', icon: Info, tone: 'bg-slate-500/10 text-slate-300' },
  ] },
];

const CATEGORY: Record<string, { dot: string; tag: string }> = {
  python: { dot: 'bg-amber-400', tag: 'bg-amber-400/10 text-amber-400' },
  systems: { dot: 'bg-cyan-400', tag: 'bg-cyan-400/10 text-cyan-400' },
  web: { dot: 'bg-emerald-400', tag: 'bg-emerald-400/10 text-emerald-400' },
};

const TARGETS = [
  { id: 't1', project: 'ml-labs', folder: '.venv', category: 'python', mb: 1802, files: '24,083', safety: 'Rebuildable', used: '3 months ago' },
  { id: 't2', project: 'ml-labs', folder: '__pycache__', category: 'python', mb: 64, files: '1,204', safety: 'Safe', used: '3 months ago' },
  { id: 't3', project: 'api-server', folder: 'target', category: 'systems', mb: 1188, files: '8,923', safety: 'Safe', used: '2 days ago' },
  { id: 't4', project: 'game-engine', folder: 'target', category: 'systems', mb: 940, files: '6,517', safety: 'Safe', used: '5 weeks ago' },
  { id: 't5', project: 'game-engine', folder: 'cmake-build-debug', category: 'systems', mb: 386, files: '2,044', safety: 'Safe', used: '5 weeks ago' },
  { id: 't6', project: 'taskmanager', folder: 'node_modules', category: 'web', mb: 626, files: '38,120', safety: 'Safe', used: '2 weeks ago' },
  { id: 't7', project: 'taskmanager', folder: '.turbo', category: 'web', mb: 88, files: '412', safety: 'Safe', used: '2 weeks ago' },
  { id: 't8', project: 'portfolio-next', folder: 'node_modules', category: 'web', mb: 418, files: '27,362', safety: 'Safe', used: '4 days ago' },
  { id: 't9', project: 'portfolio-next', folder: '.next', category: 'web', mb: 152, files: '4,210', safety: 'Safe', used: '4 days ago' },
  { id: 't10', project: 'web-app', folder: 'node_modules', category: 'web', mb: 298, files: '22,150', safety: 'Safe', used: '1 month ago' },
  { id: 't11', project: 'web-app', folder: 'dist', category: 'web', mb: 61, files: '389', safety: 'Safe', used: '1 month ago' },
  { id: 't12', project: 'scraper-ai', folder: '.venv', category: 'python', mb: 512, files: '9,871', safety: 'Rebuildable', used: '6 months ago' },
  { id: 't13', project: 'mobile-shop', folder: 'node_modules', category: 'web', mb: 744, files: '51,908', safety: 'Safe', used: '8 weeks ago' },
];

const CACHES = [
  { id: 'pnpm', name: 'pnpm store', path: '~\\AppData\\Local\\pnpm\\store', mb: 2007, eco: 'Node.js', safety: 'safe' },
  { id: 'npm', name: 'npm cache', path: '~\\AppData\\Local\\npm-cache', mb: 1352, eco: 'Node.js', safety: 'safe' },
  { id: 'cargo', name: 'cargo registry', path: '~\\.cargo\\registry', mb: 1239, eco: 'Rust', safety: 'medium' },
  { id: 'gradle', name: 'gradle caches', path: '~\\.gradle\\caches', mb: 1110, eco: 'Java', safety: 'medium' },
  { id: 'pip', name: 'pip cache', path: '~\\AppData\\Local\\pip\\Cache', mb: 820, eco: 'Python', safety: 'safe' },
  { id: 'uv', name: 'uv cache', path: '~\\AppData\\Local\\uv\\cache', mb: 640, eco: 'Python', safety: 'safe' },
  { id: 'go', name: 'go module cache', path: '~\\go\\pkg\\mod', mb: 590, eco: 'Go', safety: 'medium' },
  { id: 'nuget', name: 'NuGet packages', path: '~\\.nuget\\packages', mb: 470, eco: '.NET', safety: 'medium' },
  { id: 'bun', name: 'bun cache', path: '~\\.bun\\install\\cache', mb: 385, eco: 'Node.js', safety: 'safe' },
  { id: 'temp', name: 'user temp files', path: '~\\AppData\\Local\\Temp', mb: 315, eco: 'System', safety: 'medium' },
  { id: 'chrome', name: 'Chrome cache', path: '~\\AppData\\Local\\Google\\Chrome\\...\\Cache', mb: 268, eco: 'Browsers', safety: 'safe' },
];

const TRASH = [
  { id: 'r1', name: 'node_modules', path: 'C:\\dev\\old-site\\node_modules', mb: 1434, when: 'today' },
  { id: 'r2', name: 'target', path: 'C:\\dev\\cli-tool\\target', mb: 1126, when: 'today' },
  { id: 'r3', name: '.next', path: 'C:\\dev\\blog\\.next', mb: 720, when: 'yesterday' },
  { id: 'r4', name: '.venv', path: 'C:\\dev\\data-notebooks\\.venv', mb: 655, when: '2 days ago' },
  { id: 'r5', name: 'dist', path: 'C:\\dev\\landing-page\\dist', mb: 142, when: '3 days ago' },
  { id: 'r6', name: 'old-export.zip', path: 'C:\\Users\\me\\Downloads\\old-export.zip', mb: 980, when: 'last week' },
  { id: 'r7', name: 'build', path: 'C:\\dev\\prototype\\build', mb: 87, when: 'last week' },
];

const VIDEOS = [
  { id: 'v1', name: 'screen-recording.mov', path: '~\\Videos', mb: 3891, ext: 'mov' },
  { id: 'v2', name: 'demo-final-v7.mp4', path: '~\\Videos', mb: 2662, ext: 'mp4' },
  { id: 'v3', name: 'webinar.mkv', path: '~\\Downloads', mb: 1946, ext: 'mkv' },
  { id: 'v4', name: 'conference-talk.mp4', path: '~\\Downloads', mb: 1210, ext: 'mp4' },
  { id: 'v5', name: 'onboarding-raw.mp4', path: '~\\Desktop', mb: 980, ext: 'mp4' },
  { id: 'v6', name: 'bug-repro.webm', path: '~\\Desktop', mb: 214, ext: 'webm' },
  { id: 'v7', name: 'product-teaser.mov', path: '~\\Videos\\exports', mb: 168, ext: 'mov' },
  { id: 'v8', name: 'standup-clip.mp4', path: '~\\Downloads', mb: 92, ext: 'mp4' },
];

const LARGE = [
  { id: 'l1', name: 'dataset-v2.zip', path: '~\\Downloads', mb: 4300, ext: 'zip' },
  { id: 'l2', name: 'train_weights.pt', path: 'C:\\dev\\ml-labs\\checkpoints', mb: 2662, ext: 'pt' },
  { id: 'l3', name: 'database-backup.sql.gz', path: '~\\Desktop', mb: 1843, ext: 'gz' },
  { id: 'l4', name: 'installer.iso', path: '~\\Downloads', mb: 1433, ext: 'iso' },
  { id: 'l5', name: 'emulator-image.img', path: '~\\.android\\avd', mb: 1228, ext: 'img' },
  { id: 'l6', name: 'release-artifacts.tar.gz', path: 'C:\\dev\\api-server', mb: 760, ext: 'gz' },
  { id: 'l7', name: 'crash-dump.dmp', path: '~\\AppData\\Local\\CrashDumps', mb: 512, ext: 'dmp' },
  { id: 'l8', name: 'server.log', path: 'C:\\dev\\api-server\\logs', mb: 344, ext: 'log' },
];

const DUPLICATES = [
  { name: 'vacation.mp4', each: 118, files: [{ id: 'd1', path: '~\\Desktop' }, { id: 'd2', path: 'D:\\media\\clips' }] },
  { name: 'resume-final.docx', each: 40, files: [{ id: 'd3', path: '~\\Documents' }, { id: 'd4', path: '~\\Desktop' }, { id: 'd5', path: 'D:\\backups' }] },
  { name: 'node-v22-x64.msi', each: 31, files: [{ id: 'd6', path: '~\\Downloads' }, { id: 'd7', path: 'D:\\installers' }] },
  { name: 'design-assets.zip', each: 264, files: [{ id: 'd8', path: '~\\Downloads' }, { id: 'd9', path: 'C:\\dev\\landing-page' }, { id: 'd10', path: 'D:\\backups' }] },
  { name: 'IMG_4821.heic', each: 6, files: [{ id: 'd11', path: '~\\Pictures' }, { id: 'd12', path: '~\\Downloads' }] },
];

const size = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`);
const total = (items: { mb: number }[]) => items.reduce((sum, i) => sum + i.mb, 0);

const PRIMARY = 'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-black bg-accent hover:bg-accent/85 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default';
const SECONDARY = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-panel-2 border border-border hover:border-faint transition-colors cursor-pointer';
const DANGER = 'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-danger hover:bg-danger/85 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default';
const CARD = 'rounded-xl border border-border bg-panel';

interface Confirm { title: string; text: string; action: string; run: () => void }

function useSelection(initial: string[] = []) {
  const [ids, setIds] = useState<string[]>(initial);
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    set: setIds,
  };
}

function Box({ checked, label, onChange }: { checked: boolean | 'some'; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked === 'some' ? 'mixed' : checked}
      aria-label={label}
      onClick={onChange}
      className={`w-6 h-6 shrink-0 grid place-content-center cursor-pointer`}
    >
      <span className={`w-4 h-4 rounded-[5px] border grid place-content-center ${checked ? 'bg-accent border-accent text-black' : 'border-faint/60 bg-panel-2'}`}>
        {checked === true && <Check className="w-3 h-3 stroke-[3.5]" />}
        {checked === 'some' && <Minus className="w-3 h-3 stroke-[3.5]" />}
      </span>
    </button>
  );
}

function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h4 className="text-lg font-bold text-white">{title}</h4>
        {sub && <p className="text-xs text-muted max-w-md">{sub}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function SelectionBar({ count, mb, label, onClick }: { count: number; mb: number; label: string; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-0 z-10 mx-auto flex w-fit items-center gap-5 rounded-xl border border-accent/40 bg-panel/95 px-4 py-2.5 shadow-xl backdrop-blur">
      <span className="text-xs text-muted"><b className="text-white">{count}</b> selected <b className="ml-1.5 text-base text-white tabular-nums">{size(mb)}</b></span>
      <button type="button" className={PRIMARY} onClick={onClick}><Trash2 className="w-3.5 h-3.5" />{label}</button>
    </div>
  );
}

function CategoryBar({ items }: { items: typeof TARGETS }) {
  const groups = Object.keys(CATEGORY)
    .map((key) => ({ key, rows: items.filter((t) => t.category === key) }))
    .filter((g) => g.rows.length > 0);
  return (
    <div className="space-y-3">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-panel-2">
        {groups.map((g) => <span key={g.key} className={CATEGORY[g.key].dot} style={{ width: `${(total(g.rows) / total(items)) * 100}%` }} />)}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <div key={g.key} className="group relative">
            <button type="button" className="flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] hover:border-faint">
              <span className={`w-2 h-2 rounded-full ${CATEGORY[g.key].dot}`} />
              <span className="font-mono text-muted">{g.key}</span>
              <span className="text-faint">{size(total(g.rows))}</span>
            </button>
            <ul className="invisible absolute left-0 top-full z-20 mt-1.5 w-64 space-y-1 rounded-lg border border-border bg-panel-2 p-3 opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              {[...g.rows].sort((a, b) => b.mb - a.mb).slice(0, 5).map((t) => (
                <li key={t.id} className="flex justify-between gap-3 text-[11px]">
                  <span className="truncate font-mono text-muted">{t.project} / {t.folder}</span>
                  <span className="font-semibold text-white">{size(t.mb)}</span>
                </li>
              ))}
              {g.rows.length > 5 && <li className="text-[11px] text-faint">+ {g.rows.length - 5} more</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileList({ title, sub, files, notify }: { title: string; sub: string; files: typeof VIDEOS; notify: (m: string) => void }) {
  const [rows, setRows] = useState(files);
  const sel = useSelection();
  const chosen = rows.filter((f) => sel.has(f.id));
  const trash = () => {
    setRows((p) => p.filter((f) => !sel.has(f.id)));
    sel.set([]);
    notify(`Trashed ${chosen.length} file${chosen.length === 1 ? '' : 's'}`);
  };
  return (
    <>
      <PageHeader title={title} sub={sub}><button type="button" className={PRIMARY} onClick={() => setRows(files)}><RotateCcw className="w-3.5 h-3.5" />Scan</button></PageHeader>
      <div className={`${CARD} px-4 py-3 text-xs font-semibold text-white`}>{rows.length} files · <span className="font-normal text-muted">{size(total(rows))}</span></div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-xs text-faint"><Search className="w-3.5 h-3.5" />Filter files…</div>
      <div className="space-y-2">
        {rows.map((f) => (
          <div key={f.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${sel.has(f.id) ? 'border-accent/50 bg-accent/5' : 'border-border bg-panel'}`}>
            <Box checked={sel.has(f.id)} label={`Select ${f.name}`} onChange={() => sel.toggle(f.id)} />
            <span className="w-10 rounded bg-panel-2 py-0.5 text-center font-mono text-[10px] uppercase text-muted">{f.ext}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{f.name}</p>
              <p className="truncate font-mono text-[11px] text-faint">{f.path}</p>
            </div>
            <span className="text-xs font-semibold text-white tabular-nums">{size(f.mb)}</span>
          </div>
        ))}
      </div>
      <SelectionBar count={chosen.length} mb={total(chosen)} label="Move to Trash" onClick={trash} />
    </>
  );
}

export const DesktopAppShowcase: React.FC = () => {
  const [tab, setTab] = useState<TabId>('overview');
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const [targets, setTargets] = useState(TARGETS);
  const picked = useSelection(TARGETS.filter((t) => t.safety === 'Safe').map((t) => t.id));
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [mode, setMode] = useState<'trash' | 'permanent'>('trash');
  const [caches, setCaches] = useState(CACHES);
  const pickedCaches = useSelection();
  const [bin, setBin] = useState(TRASH);
  const [dupes, setDupes] = useState(DUPLICATES);
  const [roots, setRoots] = useState(['~/Developer', '~/Code', '~/Projects', '~/work', 'D:/dev']);
  const confirms = useSelection(['dangerous', 'medium']);
  const compacted = useSelection();

  const notify = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 3000);
  };

  const chosen = targets.filter((t) => picked.has(t.id));
  const chosenCaches = caches.filter((c) => pickedCaches.has(c.id));

  const shred = () => {
    const run = () => {
      setTargets((p) => p.filter((t) => !picked.has(t.id)));
      picked.set([]);
      notify(`${mode === 'trash' ? 'Moved' : 'Permanently deleted'} ${chosen.length} folders${mode === 'trash' ? ' to Trash' : ''}`);
    };
    if (mode === 'trash') return run();
    setConfirm({ title: 'Permanently delete these folders?', text: `${chosen.length} folders (${size(total(chosen))}). This cannot be undone.`, action: 'Delete permanently', run });
  };

  const cleanCaches = (rows: typeof CACHES) =>
    setConfirm({
      title: 'Permanently delete cache contents?',
      text: `${rows.map((c) => c.name).join(', ')} (${size(total(rows))}). This does not use the Trash and cannot be undone.`,
      action: 'Delete permanently',
      run: () => {
        setCaches((p) => p.filter((c) => !rows.includes(c)));
        pickedCaches.set([]);
        notify(`Freed ${size(total(rows))}`);
      },
    });

  const biggest = [...targets].sort((a, b) => b.mb - a.mb).slice(0, 5);
  const projects = [...new Set(targets.map((t) => t.project))]
    .map((name) => ({ name, rows: targets.filter((t) => t.project === name) }))
    .sort((a, b) => total(b.rows) - total(a.rows));

  return (
    <section id="screenshots" className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop App Window Container */}
          <div className="rounded-2xl border border-white/[0.12] bg-[#0E1418] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Window Title Bar */}
            <div className="h-11 bg-background px-4 flex items-center justify-between border-b border-white/[0.06] select-none">

              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <CodeShredderIcon size={16} />
                <span>CodeShredder</span>
              </div>
              <div className="flex items-center gap-3 text-faint text-xs" aria-hidden>
                <span>—</span><span>□</span><span>✕</span>
              </div>
            </div>

            <div className="relative flex flex-col md:flex-row md:h-[660px] bg-background">
              <aside className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-border bg-sidebar p-3 md:overflow-y-auto">
                <div className="hidden md:flex items-center gap-2.5 px-2 pb-3">
                  <CodeShredderIcon size={32} />
                  <div>
                    <p className="text-sm font-bold leading-tight text-white">CodeShredder</p>
                    <p className="text-[11px] leading-tight text-faint">fast dev cleanup</p>
                  </div>
                </div>
                <nav className="flex gap-1 overflow-x-auto md:block md:space-y-3">
                  {NAV.map((group) => (
                    <div key={group.label ?? 'main'} className="contents md:block md:space-y-0.5">
                      {group.label && <p className="hidden md:block px-2 text-[10px] font-semibold uppercase tracking-wider text-faint">{group.label}</p>}
                      {group.items.map(({ id, label, icon: Icon, tone }) => (
                        <button
                          key={id}
                          type="button"
                          aria-current={tab === id ? 'page' : undefined}
                          onClick={() => setTab(id)}
                          className={`flex shrink-0 md:w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${tab === id ? 'bg-panel-2 text-white' : 'text-muted hover:bg-panel-2 hover:text-white'}`}
                        >
                          <span className={`grid w-6 h-6 place-content-center rounded-md ${tone} ${tab === id ? 'ring-1 ring-inset ring-white/10' : ''}`}><Icon className="w-3.5 h-3.5" /></span>
                          {label}
                        </button>
                      ))}
                    </div>
                  ))}
                </nav>
              </aside>

              <div key={tab} className="flex-1 min-w-0 max-h-[70vh] md:max-h-none overflow-y-auto p-4 sm:p-6 space-y-4">
                {tab === 'overview' && (
                  <>
                    <PageHeader title="Overview" />
                    <div className={`${CARD} space-y-4 p-5`}>
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Reclaimable</p>
                          <p className="text-4xl font-bold tabular-nums text-white">{size(total(targets))}</p>
                          <p className="text-xs text-muted">{targets.length} folders can be cleaned</p>
                        </div>
                        <button type="button" className={PRIMARY} onClick={() => setTab('shred')}>Review results<ArrowRight className="w-3.5 h-3.5" /></button>
                      </div>
                      {targets.length > 0 && <CategoryBar items={targets} />}
                    </div>
                    <div className="grid lg:grid-cols-3 gap-3">
                      {([
                        ['caches', 'Caches', 'Package manager caches', FolderX, 'bg-amber-500/10 text-amber-400'],
                        ['large_files', 'Large Files', 'What takes the most room', HardDrive, 'bg-cyan-500/10 text-cyan-400'],
                        ['duplicates', 'Duplicates', 'Identical copies', Copy, 'bg-violet-500/10 text-violet-400'],
                      ] as const).map(([id, label, hint, Icon, tone]) => (
                        <button key={id} type="button" onClick={() => setTab(id)} className={`${CARD} flex items-center gap-2.5 p-3 text-left hover:border-faint cursor-pointer`}>
                          <span className={`grid w-8 h-8 shrink-0 place-content-center rounded-lg ${tone}`}><Icon className="w-4 h-4" /></span>
                          <span className="min-w-0"><span className="block text-xs font-semibold text-white">{label}</span><span className="block truncate text-[11px] text-muted">{hint}</span></span>
                        </button>
                      ))}
                    </div>
                    <div className={`${CARD} space-y-3 p-4`}>
                      <p className="text-xs font-semibold text-white">Biggest folders</p>
                      {biggest.map((t) => (
                        <div key={t.id}>
                          <div className="flex justify-between text-xs"><span className="font-mono text-muted">{t.project} / {t.folder}</span><span className="font-semibold text-white">{size(t.mb)}</span></div>
                          <div className="mt-1 h-1 rounded-full bg-panel-2"><div className="h-full rounded-full bg-accent" style={{ width: `${(t.mb / biggest[0].mb) * 100}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {tab === 'shred' && (
                  <>
                    <PageHeader title="Shred" sub="Find heavy developer folders and reclaim space safely.">
                      <button type="button" className={PRIMARY} onClick={() => { setTargets(TARGETS); notify('Scan complete'); }}>Scan folders</button>
                    </PageHeader>
                    <div className="flex flex-wrap gap-1.5">
                      {roots.map((r) => <span key={r} className="flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 font-mono text-[11px] text-muted"><span className="w-1.5 h-1.5 rounded-full bg-safe" />{r}</span>)}
                    </div>
                    <button type="button" aria-expanded={patternsOpen} onClick={() => setPatternsOpen(!patternsOpen)} className="flex items-center gap-1 py-1 text-xs font-medium text-muted hover:text-white cursor-pointer">
                      <ChevronDown className={`w-3.5 h-3.5 ${patternsOpen ? '' : '-rotate-90'}`} />Patterns · 10 enabled
                    </button>
                    {patternsOpen && (
                      <div className="flex flex-wrap gap-1.5">
                        {['node_modules', '.next', '.nuxt', 'dist', 'build', 'target', '__pycache__', '.pytest_cache', '.parcel-cache', '.turbo'].map((p) => <span key={p} className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-white">{p}</span>)}
                      </div>
                    )}
                    <div className={`${CARD} space-y-3 p-4`}>
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Reclaimable</p>
                          <p className="text-4xl font-bold tabular-nums text-white">{size(total(targets))}</p>
                        </div>
                        <p className="text-[11px] text-faint">Hover a category to see its biggest folders</p>
                      </div>
                      {targets.length > 0 && <CategoryBar items={targets} />}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {([['trash', 'Move to Trash', 'Recoverable', Recycle], ['permanent', 'Delete permanently', 'Not recoverable', Zap]] as const).map(([id, label, hint, Icon]) => (
                        <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={`rounded-lg border p-3 text-left cursor-pointer ${mode === id ? 'border-accent/60 bg-accent/10 text-accent' : 'border-border bg-panel text-white'}`}>
                          <span className="flex items-center gap-1.5 text-xs font-semibold"><Icon className="w-3.5 h-3.5" />{label}</span>
                          <span className="text-[11px] text-faint">{hint}</span>
                        </button>
                      ))}
                    </div>
                    {targets.length > 0 && (
                      <div className="flex items-center justify-end gap-1.5 text-xs text-muted">
                        <Box
                          checked={chosen.length === targets.length ? true : chosen.length > 0 ? 'some' : false}
                          label="Select all targets"
                          onChange={() => picked.set(chosen.length === targets.length ? [] : targets.map((t) => t.id))}
                        />
                        Select all
                      </div>
                    )}
                    {projects.map(({ name, rows }) => {
                      const ids = rows.map((t) => t.id);
                      const count = ids.filter(picked.has).length;
                      const toggleProject = () =>
                        picked.set(count === ids.length
                          ? picked.ids.filter((id) => !ids.includes(id))
                          : [...new Set([...picked.ids, ...ids])]);
                      return (
                        <div key={name} className={`${CARD} overflow-hidden`}>
                          <div className="flex items-center gap-2.5 bg-panel-2/70 px-3 py-1.5">
                            <Box checked={count === ids.length ? true : count > 0 ? 'some' : false} label={`Select all targets in ${name}`} onChange={toggleProject} />
                            <FolderGit2 className="w-4 h-4 text-accent" />
                            <span className="text-xs font-semibold text-white">{name}</span>
                            <span className="text-[11px] text-faint">{rows.length} target{rows.length === 1 ? '' : 's'}</span>
                            <span className="hidden sm:flex items-center gap-1 rounded-full border border-accent/25 bg-accent/5 px-2 text-[10px] text-accent"><Clock3 className="w-3 h-3" />{rows[0].used}</span>
                            <span className="ml-auto text-xs font-semibold text-white">{size(total(rows))}</span>
                          </div>
                          {rows.map((t) => (
                            <div key={t.id} className="flex items-center gap-2.5 border-l-2 border-t border-l-accent/30 border-t-border/60 py-2 pl-7 pr-3">
                              <Box checked={picked.has(t.id)} label={`Select ${t.folder} in ${name}`} onChange={() => picked.toggle(t.id)} />
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 font-mono text-xs font-semibold text-white">{t.folder}<span className={`rounded-full px-2 text-[10px] font-medium uppercase ${CATEGORY[t.category].tag}`}>{t.category}</span></p>
                                <p className="truncate font-mono text-[11px] text-faint">C:\dev\{name}\{t.folder} · {t.files} files</p>
                              </div>
                              <div className="text-right"><p className="text-xs font-semibold text-white">{size(t.mb)}</p><p className="text-[10px] text-faint">{t.safety}</p></div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    <SelectionBar count={chosen.length} mb={total(chosen)} label={mode === 'trash' ? 'Move to Trash' : 'Permanently delete'} onClick={shred} />
                  </>
                )}

                {tab === 'recycle' && (
                  <>
                    <PageHeader title="Recycle Bin" sub="Everything in your system Recycle Bin, including items deleted by other apps.">
                      <button type="button" className={SECONDARY} onClick={() => setBin(TRASH)}><RotateCcw className="w-3.5 h-3.5" />Refresh</button>
                      <button type="button" className={DANGER} disabled={bin.length === 0} onClick={() => setConfirm({ title: 'Empty the Recycle Bin?', text: `All ${bin.length} items will be permanently deleted.`, action: 'Empty permanently', run: () => { setBin([]); notify('Recycle Bin emptied'); } })}><Trash2 className="w-3.5 h-3.5" />Empty</button>
                    </PageHeader>
                    <div className={`${CARD} px-4 py-3 text-xs font-semibold text-white`}>{bin.length} items · <span className="font-normal text-muted">{size(total(bin))} claimable</span></div>
                    {bin.map((item) => (
                      <div key={item.id} className={`${CARD} flex items-center gap-3 px-3 py-2.5`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white">{item.name}</p>
                          <p className="truncate font-mono text-[11px] text-faint">{item.path} · {item.when}</p>
                        </div>
                        <span className="text-xs font-semibold text-white">{size(item.mb)}</span>
                        <button type="button" aria-label={`Restore ${item.name}`} className="p-1.5 text-muted hover:text-safe cursor-pointer" onClick={() => { setBin((p) => p.filter((x) => x.id !== item.id)); notify('Item restored to its original location'); }}><ArchiveRestore className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </>
                )}

                {tab === 'caches' && (
                  <>
                    <PageHeader title="Caches" sub="Clear system-wide package manager caches. Cleaning is permanent.">
                      <button type="button" className={SECONDARY} onClick={() => setCaches(CACHES)}><RotateCcw className="w-3.5 h-3.5" />Refresh</button>
                      <button type="button" className={PRIMARY} disabled={chosenCaches.length === 0} onClick={() => cleanCaches(chosenCaches)}><FolderX className="w-3.5 h-3.5" />Clean caches</button>
                    </PageHeader>
                    <div className={`${CARD} px-4 py-3 text-xs font-semibold text-white`}>{caches.length} caches · <span className="font-normal text-muted">{size(total(caches))}</span></div>
                    {caches.map((c) => (
                      <div key={c.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${pickedCaches.has(c.id) ? 'border-accent/50 bg-accent/5' : 'border-border bg-panel'}`}>
                        <Box checked={pickedCaches.has(c.id)} label={`Select ${c.name}`} onChange={() => pickedCaches.toggle(c.id)} />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-xs font-semibold text-white">{c.name}<span className={`rounded-full px-2 text-[10px] font-medium ${c.safety === 'safe' ? 'bg-safe/10 text-safe' : 'bg-warning/10 text-warning'}`}>{c.safety}</span></p>
                          <p className="truncate font-mono text-[11px] text-faint">{c.path}</p>
                        </div>
                        <div className="text-right"><p className="text-xs font-semibold text-white">{size(c.mb)}</p><p className="text-[10px] text-faint">{c.eco}</p></div>
                        <button type="button" aria-label={`Clean ${c.name}`} className="p-1.5 text-muted hover:text-danger cursor-pointer" onClick={() => cleanCaches([c])}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </>
                )}

                {tab === 'duplicates' && (
                  <>
                    <PageHeader title="Duplicates" sub="Find and remove identical files across your drives.">
                      <button type="button" className={PRIMARY} onClick={() => setDupes(DUPLICATES)}><RotateCcw className="w-3.5 h-3.5" />Scan for duplicates</button>
                    </PageHeader>
                    {dupes.length === 0 && <p className={`${CARD} p-8 text-center text-xs text-muted`}>No duplicates found</p>}
                    {dupes.map((g) => (
                      <div key={g.name} className={CARD}>
                        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                          <p className="text-xs font-semibold text-white">{g.files.length} identical files <span className="font-normal text-muted">· {size(g.each)} each</span></p>
                          <button type="button" className="flex items-center gap-1 py-1 text-[11px] text-muted hover:text-danger cursor-pointer" onClick={() => { setDupes((p) => p.filter((x) => x.name !== g.name)); notify(`Trashed ${g.files.length - 1} files, kept the newest`); }}><Trash2 className="w-3.5 h-3.5" />Trash all but newest</button>
                        </div>
                        {g.files.map((f, i) => (
                          <div key={f.id} className="flex items-center gap-3 px-3 py-2">
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-2 text-xs text-white">{g.name}{i === 0 && <span className="rounded-full bg-safe/10 px-2 text-[10px] font-medium text-safe">Newest</span>}</p>
                              <p className="truncate font-mono text-[11px] text-faint">{f.path}\{g.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )}

                {tab === 'videos' && <FileList key="videos" title="Videos" sub="Spot large video files eating your disk, sorted by size." files={VIDEOS} notify={notify} />}
                {tab === 'large_files' && <FileList key="large" title="Large Files" sub="Find videos, archives, logs and installer dumps eating your disk." files={LARGE} notify={notify} />}

                {tab === 'wsl' && (
                  <>
                    <PageHeader title="WSL" sub="Clean distros and compact their virtual disks.">
                      <button type="button" className={SECONDARY} onClick={() => notify('WSL shut down')}>Shut down WSL</button>
                    </PageHeader>
                    {[
                      { name: 'Ubuntu-22.04', before: '45.2 GB', after: '40.9 GB', freed: '4.3 GB' },
                      { name: 'Debian', before: '12.7 GB', after: '11.1 GB', freed: '1.6 GB' },
                      { name: 'kali-linux', before: '8.4 GB', after: '7.8 GB', freed: '0.6 GB' },
                    ].map((d) => (
                      <div key={d.name} className={`${CARD} flex flex-wrap items-center gap-3 p-4`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white">{d.name}</p>
                          <p className="truncate font-mono text-[11px] text-faint">ext4.vhdx · {compacted.has(d.name) ? d.after : d.before}</p>
                        </div>
                        <button type="button" className={SECONDARY} onClick={() => notify(`Cleanup ran in ${d.name}`)}>Clean</button>
                        <button type="button" className={PRIMARY} disabled={compacted.has(d.name)} onClick={() => setConfirm({ title: `Compact ${d.name}?`, text: 'All WSL distros are shut down first.', action: 'Compact', run: () => { compacted.toggle(d.name); notify(`Freed ${d.freed} from ${d.name}`); } })}>{compacted.has(d.name) ? 'Compacted' : 'Compact disk'}</button>
                      </div>
                    ))}
                  </>
                )}

                {tab === 'settings' && (
                  <>
                    <PageHeader title="Settings" sub="Control scan roots, enabled patterns, ignored folders and deletion behavior.">
                      <button type="button" className={SECONDARY} onClick={() => setRoots(['~/Developer', '~/Code', '~/Projects', '~/work', 'D:/dev'])}><RotateCcw className="w-3.5 h-3.5" />Add default folders</button>
                    </PageHeader>
                    <div className={`${CARD} space-y-2 p-4`}>
                      <p className="text-xs font-semibold text-white">Scan folders</p>
                      {roots.map((r) => (
                        <div key={r} className="flex items-center gap-2 rounded-lg border border-border bg-panel-2/60 px-3 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-safe" />
                          <span className="flex-1 font-mono text-[11px] text-white">{r}</span>
                          <button type="button" aria-label={`Remove ${r}`} className="p-1 text-faint hover:text-danger cursor-pointer" onClick={() => setRoots((p) => p.filter((x) => x !== r))}><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      <span className="flex items-center gap-1.5 text-[11px] text-muted"><FolderOpen className="w-3.5 h-3.5" /><Plus className="w-3 h-3" />Add folder…</span>
                    </div>
                    <div className={`${CARD} space-y-2 p-4`}>
                      <p className="text-xs font-semibold text-white">Confirmations</p>
                      {['dangerous', 'medium'].map((level) => (
                        <div key={level} className="flex items-center gap-2 text-xs text-white">
                          <Box checked={confirms.has(level)} label={`Confirm ${level} folders`} onChange={() => confirms.toggle(level)} />
                          <span>Ask before deleting folders flagged <span className="font-medium text-warning">{level}</span></span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {tab === 'about' && (
                  <>
                    <PageHeader title="About" sub="What CodeShredder is and where to find help." />
                    <div className={`${CARD} space-y-3 p-5`}>
                      <div className="flex items-center gap-3">
                        <CodeShredderIcon size={44} />
                        <div><p className="text-base font-bold text-white">CodeShredder</p><p className="font-mono text-[11px] text-muted">Tauri 2 + Rust</p></div>
                      </div>
                      <p className="text-xs leading-relaxed text-muted">A fast, safe cleanup app for developers. It finds heavy generated folders, caches, WSL bloat, large files and duplicates, then moves what you pick to the Trash.</p>
                      <p className="flex items-start gap-2 text-xs text-muted"><ShieldCheck className="w-4 h-4 shrink-0 text-safe" />Everything runs locally. No accounts or analytics; the only network call checks for updates.</p>
                    </div>
                    <div className={`${CARD} p-3`}>
                      {[['GitHub repository', siteConfig.githubUrl], ['Release notes', siteConfig.releasesUrl], ['Report an issue', siteConfig.issuesUrl]].map(([label, url]) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-white hover:bg-panel-2">{label}<ExternalLink className="w-3.5 h-3.5 text-muted" /></a>
                      ))}
                    </div>
                    <p className="text-[11px] text-faint">Built by Akshad (<a href="https://github.com/akshad-exe" target="_blank" rel="noopener noreferrer" className="inline-block py-1 font-semibold text-accent hover:underline">@akshad-exe</a>) · Released under the MIT License.</p>
                  </>
                )}
              </div>

              {notice && (
                <p role="status" className="absolute right-3 top-3 z-30 rounded-lg border border-safe/30 bg-panel-2 px-3 py-2 text-xs text-safe shadow-xl animate-fadeIn">{notice}</p>
              )}

              {confirm && (
                <div className="absolute inset-0 z-40 grid place-items-center bg-black/70 p-4">
                  <div role="alertdialog" aria-label={confirm.title} className="w-full max-w-sm rounded-xl border border-border bg-panel p-5 shadow-2xl">
                    <p className="text-sm font-bold text-white">{confirm.title}</p>
                    <p className="mt-1.5 text-xs text-muted">{confirm.text}</p>
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" className={SECONDARY} onClick={() => setConfirm(null)}>Cancel</button>
                      <button type="button" className={DANGER} onClick={() => { confirm.run(); setConfirm(null); }}>{confirm.action}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        <p className="mt-3 text-center text-xs text-faint">Interactive preview of the Windows build with sample data. Nothing on your computer is touched.</p>
      </div>
    </section>
  );
};
