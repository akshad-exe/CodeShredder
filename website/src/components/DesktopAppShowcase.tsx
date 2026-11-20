import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Database,
  Terminal,
  FileText,
  Copy,
    Settings,
  Info,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Wrench,
  Layers,
  Box,
  Check,
  HardDrive,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FolderOpen,
  LayoutDashboard,
  Recycle,
  Film,
  FolderX,
  Plus,
  X,
  RotateCcw,
} from 'lucide-react';
import { CodeShredderIcon } from './CodeShredderIcon';
import { LinuxIcon, WslIcon, WindowsIcon } from './BrandIcons';
import { siteConfig } from '../config/site';
import ctaMountainImg from '../assets/images/cta_mountain_sunset_1791697159659.jpg';

interface FileItem {
  id: string;
  name: string;
  sizeStr: string;
  sizeBytes: number;
  type: string;
  path: string;
}

type TabId = 'overview' | 'shred' | 'recycle' | 'caches' | 'duplicates' | 'videos' | 'large_files' | 'wsl' | 'settings' | 'about';
const ic = 'w-4 h-4';
const NAV_GROUPS: { label?: string; items: { id: TabId; label: string; icon: React.ReactNode }[] }[] = [
  { items: [{ id: 'overview', label: 'Overview', icon: <LayoutDashboard className={ic} /> }] },
  { label: 'Reclaim', items: [
    { id: 'shred', label: 'Shred', icon: <Trash2 className={ic} /> },
    { id: 'recycle', label: 'Recycle Bin', icon: <Recycle className={ic} /> },
    { id: 'caches', label: 'Caches', icon: <FolderX className={ic} /> },
    { id: 'duplicates', label: 'Duplicates', icon: <Copy className={ic} /> },
  ] },
  { label: 'Discover', items: [
    { id: 'videos', label: 'Videos', icon: <Film className={ic} /> },
    { id: 'large_files', label: 'Large Files', icon: <HardDrive className={ic} /> },
  ] },
  { label: 'System', items: [{ id: 'wsl', label: 'WSL', icon: <Terminal className={ic} /> }] },
];

const initialFiles: FileItem[] = [
  { id: '1', name: 'node_modules', sizeStr: '1.8 GB', sizeBytes: 1800, type: 'Dependency', path: '.../my-app/node_modules' },
  { id: '2', name: '.next', sizeStr: '1.2 GB', sizeBytes: 1200, type: 'Build', path: '.../my-app/.next' },
  { id: '3', name: 'target', sizeStr: '920 MB', sizeBytes: 920, type: 'Build', path: '.../rust-project/target' },
  { id: '4', name: '.venv', sizeStr: '460 MB', sizeBytes: 460, type: 'Virtual Env', path: '.../ml-project/.venv' },
  { id: '5', name: '__pycache__', sizeStr: '380 MB', sizeBytes: 380, type: 'Cache', path: '.../scripts/__pycache__' },
  { id: '6', name: 'Docker cache', sizeStr: '1.1 GB', sizeBytes: 1100, type: 'Cache', path: '.../Docker' },
  { id: '7', name: 'WSL (Ubuntu)', sizeStr: '4.3 GB', sizeBytes: 4300, type: 'WSL', path: '(Manage)' },
];

export const DesktopAppShowcase: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialFiles.map((f) => f.id));
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Caches page states
  const [selectedCaches, setSelectedCaches] = useState<string[]>(['npm', 'cargo', 'pip', 'go', 'vscode']);
  // Large files page states
  const [selectedLargeFiles, setSelectedLargeFiles] = useState<string[]>(['1', '2', '3']);
  // WSL compaction simulation
  const [wslCompacting, setWslCompacting] = useState(false);
  const [wslCompacted, setWslCompacted] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === initialFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialFiles.map((f) => f.id));
    }
  };

  const totalSelectedMb = selectedIds.reduce((sum, id) => {
    const file = initialFiles.find((f) => f.id === id);
    return sum + (file ? file.sizeBytes : 0);
  }, 0);

  const formattedSelectedSize =
    totalSelectedMb >= 1000
      ? `${(totalSelectedMb / 1000).toFixed(1)} GB`
      : `${totalSelectedMb} MB`;

  const handleAction = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCompactWsl = () => {
    setWslCompacting(true);
    setTimeout(() => {
      setWslCompacting(false);
      setWslCompacted(true);
      handleAction('WSL2 VHDX compacted! Reclaimed 4.3 GB to Windows C:');
    }, 1800);
  };

  return (
    <section id="screenshots" className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle Backdrop Container around the desktop frame */}
        <div className="relative rounded-3xl p-3 sm:p-6 lg:p-10 border border-white/[0.08] bg-background overflow-hidden shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)]">
          {/* Background mountain ambient twilight scenery behind the window */}
          <div className="absolute inset-0 -z-10 opacity-30">
            <img
              src={ctaMountainImg}
              alt="Mountain landscape background"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter blur-xs"
            />
            <div className="absolute inset-0 bg-background/80" />
          </div>

          {/* Desktop App Window Container */}
          <div className="rounded-2xl border border-white/[0.12] bg-[#0E1418] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Window Title Bar */}
            <div className="h-11 bg-background px-4 flex items-center justify-between border-b border-white/[0.06] select-none">
              {/* macOS Traffic Lights */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
              </div>

              {/* Window Title Center */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted">
                <CodeShredderIcon size={16} />
                <span>CodeShredder — Desktop Clean Utility ({siteConfig.version})</span>
              </div>

              {/* Windows Window Controls */}
              <div className="flex items-center gap-3 text-faint text-xs">
                <span className="hover:text-white cursor-pointer px-1">—</span>
                <span className="hover:text-white cursor-pointer px-1">□</span>
                <span className="hover:text-white cursor-pointer px-1">✕</span>
              </div>
            </div>

            {/* Window Inner Layout (Sidebar + Main View) */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
              {/* Sidebar */}
              <div className="md:col-span-3 lg:col-span-3 bg-background border-r border-white/[0.06] p-4 flex flex-col justify-between">
                <div>
                  {/* Sidebar Brand Header */}
                  <div className="flex items-center gap-2.5 px-2 py-2 mb-4">
                    <CodeShredderIcon size={24} />
                    <span className="text-base font-extrabold text-white tracking-tight">
                      Code<span className="text-accent">Shredder</span>
                    </span>
                  </div>

                  {/* Sidebar Navigation (mirrors the app's groups) */}
                  <nav className="space-y-4">
                    {NAV_GROUPS.map((group) => (
                      <div key={group.label ?? 'main'} className="space-y-1">
                        {group.label && (
                          <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-faint">
                            {group.label}
                          </div>
                        )}
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              activeTab === item.id
                                ? 'bg-accent/15 text-white font-semibold border border-accent/30'
                                : 'text-muted border border-transparent hover:bg-white/[0.03] hover:text-white'
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Sidebar Bottom Items */}
                <div className="pt-4 border-t border-white/[0.06] space-y-1">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-accent/15 text-white font-semibold border border-accent/30'
                        : 'text-muted border border-transparent hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'about'
                        ? 'bg-accent/15 text-white font-semibold border border-accent/30'
                        : 'text-muted border border-transparent hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    <span>About</span>
                  </button>
                </div>
              </div>

              {/* Main Panel Viewport */}
              <div className="md:col-span-9 lg:col-span-9 p-4 sm:p-6 flex flex-col justify-between bg-panel">
                {/* 1. SCAN VIEW (Default Showcase) */}
                {activeTab === 'shred' && (
                  <div>
                    {/* Scan Complete Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-panel-2 border border-white/[0.06] mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            Scan Complete
                          </h4>
                          <p className="text-xs text-muted">
                            Found 12.4 GB of reclaimable space
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAction('Shredding selected 12.4 GB...')}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-black bg-accent hover:bg-accent/80 rounded-lg transition-all shadow-[0_0_15px_rgba(255,112,43,0.3)] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Shred Selected</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 4 Summary Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                      <div className="p-3 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Box className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">1.2 GB</div>
                          <div className="text-[11px] text-muted">Dependencies</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">4.8 GB</div>
                          <div className="text-[11px] text-muted">Build Artifacts</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">2.1 GB</div>
                          <div className="text-[11px] text-muted">Caches</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                          <LinuxIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">4.3 GB</div>
                          <div className="text-[11px] text-muted">WSL</div>
                        </div>
                      </div>
                    </div>

                    {/* File Results Table */}
                    <div className="rounded-xl border border-white/[0.06] bg-panel-2 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-faint font-semibold">
                            <th className="py-2.5 px-3 w-8">
                              <button
                                onClick={toggleSelectAll}
                                className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-colors ${
                                  selectedIds.length === initialFiles.length
                                    ? 'bg-accent text-black'
                                    : 'border border-white/20 bg-white/5'
                                }`}
                                aria-label="Select all"
                              >
                                {selectedIds.length === initialFiles.length && (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )}
                              </button>
                            </th>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Size</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Path</th>
                            <th className="py-2.5 px-3 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {initialFiles.map((file) => {
                            const isChecked = selectedIds.includes(file.id);
                            return (
                              <tr
                                key={file.id}
                                onClick={() => toggleSelect(file.id)}
                                className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                              >
                                <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => toggleSelect(file.id)}
                                    className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-colors ${
                                      isChecked
                                        ? 'bg-accent text-black'
                                        : 'border border-white/20 bg-white/5'
                                    }`}
                                    aria-label={`Select ${file.name}`}
                                  >
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 font-mono font-medium text-white">
                                  {file.name}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-muted tabular-nums">
                                  {file.sizeStr}
                                </td>
                                <td className="py-2.5 px-3 text-muted">
                                  {file.type}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-faint truncate max-w-[180px]">
                                  {file.path}
                                </td>
                                <td className="py-2.5 px-3 text-faint">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. CACHES PAGE */}
                {activeTab === 'caches' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center text-[#A5B4FC]">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Runtime & Package Caches</h4>
                          <p className="text-xs text-muted">2.1 GB of cached packages safe to purge (re-downloaded on demand)</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAction('Purged 2.1 GB of package caches!')}
                        className="px-4 py-2 text-xs font-bold text-black bg-accent hover:bg-accent/80 rounded-lg transition-colors cursor-pointer"
                      >
                        Purge All Caches (2.1 GB)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-panel-2 border border-white/[0.06]">
                        <div className="text-xs text-muted">npm / yarn</div>
                        <div className="text-base font-mono font-bold text-white mt-1">840 MB</div>
                      </div>
                      <div className="p-3 rounded-xl bg-panel-2 border border-white/[0.06]">
                        <div className="text-xs text-muted">Cargo Crates</div>
                        <div className="text-base font-mono font-bold text-white mt-1">620 MB</div>
                      </div>
                      <div className="p-3 rounded-xl bg-panel-2 border border-white/[0.06]">
                        <div className="text-xs text-muted">pip / uv</div>
                        <div className="text-base font-mono font-bold text-white mt-1">310 MB</div>
                      </div>
                      <div className="p-3 rounded-xl bg-panel-2 border border-white/[0.06]">
                        <div className="text-xs text-muted">Go build</div>
                        <div className="text-base font-mono font-bold text-white mt-1">420 MB</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {[
                        { id: 'npm', name: 'npm Cache (~/.npm/_cacache)', size: '840 MB', desc: 'Cached tarballs from npm install commands' },
                        { id: 'cargo', name: 'Cargo Registry Cache (~/.cargo/registry/cache)', size: '620 MB', desc: 'Pre-downloaded .crate archives from crates.io' },
                        { id: 'pip', name: 'Python pip Cache (~/.cache/pip)', size: '310 MB', desc: 'Downloaded wheel files and index cache' },
                        { id: 'go', name: 'Go Build Cache (~/.cache/go-build)', size: '420 MB', desc: 'Compiler hashes and cached package test results' },
                        { id: 'vscode', name: 'VS Code Workspace Storage', size: '180 MB', desc: 'Stale cached state from closed editor windows' },
                      ].map((cache) => (
                        <div key={cache.id} className="p-3 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedCaches.includes(cache.id)}
                              onChange={() =>
                                setSelectedCaches((prev) =>
                                  prev.includes(cache.id)
                                    ? prev.filter((i) => i !== cache.id)
                                    : [...prev, cache.id]
                                )
                              }
                              className="accent-accent rounded cursor-pointer"
                            />
                            <div>
                              <div className="text-xs font-mono font-bold text-white">{cache.name}</div>
                              <div className="text-[11px] text-muted">{cache.desc}</div>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold text-accent">{cache.size}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. WSL MANAGER PAGE */}
                {activeTab === 'wsl' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E95420]/15 border border-[#E95420]/30 flex items-center justify-center text-[#E95420]">
                          <WslIcon className="w-5 h-5 text-[#E95420]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">WSL2 Virtual Disk Reclaimer</h4>
                          <p className="text-xs text-muted">Compact ext4.vhdx virtual disks that grow dynamically but never shrink</p>
                        </div>
                      </div>

                      <button
                        onClick={handleCompactWsl}
                        disabled={wslCompacting || wslCompacted}
                        className="px-4 py-2 text-xs font-bold text-black bg-accent hover:bg-accent/80 disabled:opacity-60 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                      >
                        {wslCompacting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                            <span>Compacting VHDX...</span>
                          </>
                        ) : wslCompacted ? (
                          <span>Compacted (4.3 GB Freed)</span>
                        ) : (
                          <span>Compact All (4.3 GB)</span>
                        )}
                      </button>
                    </div>

                    {/* WSL Distribution Cards */}
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <WslIcon className="w-4 h-4 text-[#E95420]" />
                          <span className="text-xs font-bold text-white">Ubuntu-22.04 (Default WSL2)</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {wslCompacted ? 'Compacted' : '4.3 GB Reclaimable'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-black/40">
                          <div className="text-[10px] text-faint">Host Size on Windows</div>
                          <div className="font-mono font-bold text-white mt-0.5">
                            {wslCompacted ? '40.9 GB' : '45.2 GB'}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40">
                          <div className="text-[10px] text-faint">Real Size inside Linux</div>
                          <div className="font-mono font-bold text-white mt-0.5">12.8 GB</div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40">
                          <div className="text-[10px] text-faint">Free Space inside VHD</div>
                          <div className="font-mono font-bold text-accent mt-0.5">
                            {wslCompacted ? '0.2 GB' : '4.3 GB'}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-faint truncate">
                        C:\Users\Developer\AppData\Local\Packages\CanonicalGroupLimited...\LocalState\ext4.vhdx
                      </div>
                    </div>

                    {/* How WSL compaction works banner */}
                    <div className="p-3.5 rounded-xl bg-[#10171C] border border-accent/20 flex items-start gap-3 text-xs text-muted">
                      <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Why WSL disks bloat:</span> WSL2 virtual disks expand dynamically when you download packages or build docker images, but deleting files in Linux does not shrink the .vhdx on Windows. CodeShredder shuts down WSL and executes diskpart compact to reclaim space immediately.
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. LARGE FILES PAGE */}
                {activeTab === 'large_files' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Large File Explorer (&gt; 50 MB)</h4>
                        <p className="text-xs text-muted">Found 22.1 GB of large binaries, disk images, and archives</p>
                      </div>
                      <button
                        onClick={() => handleAction('Safely moved selected large files to Trash')}
                        className="px-4 py-2 text-xs font-bold text-black bg-accent hover:bg-accent/80 rounded-lg transition-colors cursor-pointer"
                      >
                        Move Selected to Trash
                      </button>
                    </div>

                    <div className="space-y-2">
                      {[
                        { id: '1', name: 'docker-desktop-data.vhdx', size: '12.8 GB', path: '~/AppData/Local/Docker/wsl/data', type: 'Virtual Disk' },
                        { id: '2', name: 'release-artifacts-v1.4.tar.gz', size: '4.2 GB', path: '~/projects/api/release-artifacts-v1.4.tar.gz', type: 'Archive' },
                        { id: '3', name: 'train_weights_epoch_50.pt', size: '2.6 GB', path: '~/ml-pipeline/checkpoints/train_weights_epoch_50.pt', type: 'ML Weights' },
                        { id: '4', name: 'postgres-backup-2024.sql.gz', size: '1.8 GB', path: '~/backups/postgres-backup-2024.sql.gz', type: 'Database' },
                        { id: '5', name: 'electron-dist-win-x64.zip', size: '890 MB', path: '~/dist/electron-dist-win-x64.zip', type: 'Binary' },
                      ].map((item) => (
                        <div key={item.id} className="p-3 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedLargeFiles.includes(item.id)}
                              onChange={() =>
                                setSelectedLargeFiles((prev) =>
                                  prev.includes(item.id)
                                    ? prev.filter((i) => i !== item.id)
                                    : [...prev, item.id]
                                )
                              }
                              className="accent-accent rounded cursor-pointer"
                            />
                            <div>
                              <div className="text-xs font-mono font-bold text-white">{item.name}</div>
                              <div className="text-[11px] text-muted">{item.type} · <span className="font-mono text-faint">{item.path}</span></div>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold text-accent">{item.size}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-lg font-bold text-white">Overview</h4>
                      <p className="text-xs text-muted">Where your disk space is going, and what you can safely reclaim.</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Reclaimable', value: '12.4 GB', hot: true },
                        { label: 'Projects found', value: '38' },
                        { label: 'Freed so far', value: '41.7 GB' },
                        { label: 'Last scan', value: '2 min ago' },
                      ].map((c) => (
                        <div key={c.label} className="p-3.5 rounded-xl bg-panel-2 border border-white/[0.06]">
                          <div className="text-[10px] uppercase tracking-wider text-faint font-semibold">{c.label}</div>
                          <div className={`mt-1 text-lg font-mono font-bold tabular-nums ${c.hot ? 'text-accent' : 'text-white'}`}>{c.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] space-y-3">
                      <div className="text-xs font-bold text-white">Space by category</div>
                      <div className="flex h-2.5 rounded-full overflow-hidden bg-background">
                        <span className="bg-accent" style={{ width: '44%' }} />
                        <span className="bg-amber-400" style={{ width: '24%' }} />
                        <span className="bg-violet-400" style={{ width: '18%' }} />
                        <span className="bg-emerald-400" style={{ width: '14%' }} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                        <span><span className="inline-block w-2 h-2 rounded-full bg-accent mr-1.5" />Dependencies</span>
                        <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" />Build output</span>
                        <span><span className="inline-block w-2 h-2 rounded-full bg-violet-400 mr-1.5" />Caches</span>
                        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />Virtual envs</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06]">
                      <div className="text-xs font-bold text-white mb-2">Recent cleanups</div>
                      {[['my-app', '2.9 GB', 'Today'], ['rust-project', '920 MB', 'Yesterday'], ['ml-project', '460 MB', '3 days ago']].map(([n, sz, when]) => (
                        <div key={n} className="flex items-center justify-between py-1.5 text-xs border-t first:border-t-0 border-white/[0.05]">
                          <span className="font-mono text-white">{n}</span>
                          <span className="text-muted">{when}</span>
                          <span className="font-mono text-accent tabular-nums">{sz}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECYCLE BIN */}
                {activeTab === 'recycle' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">Recycle Bin</h4>
                        <p className="text-xs text-muted">Everything CodeShredder removed stays here until you empty it. Restore any item.</p>
                      </div>
                      <button onClick={() => handleAction('Emptied the Recycle Bin and reclaimed 3.2 GB')} className="px-4 py-2 text-xs font-bold text-black bg-accent hover:bg-accent/80 rounded-lg transition-colors cursor-pointer shrink-0">
                        Empty Bin
                      </button>
                    </div>
                    {[
                      { n: 'node_modules', p: '~/projects/old-site', s: '1.4 GB', t: 'Today' },
                      { n: 'target', p: '~/projects/cli-tool', s: '1.1 GB', t: 'Today' },
                      { n: '.next', p: '~/projects/blog', s: '720 MB', t: 'Yesterday' },
                    ].map((i) => (
                      <div key={i.n + i.p} className="p-3 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <div className="text-xs font-mono font-bold text-white">{i.n}</div>
                          <div className="text-[11px] text-muted"><span className="font-mono text-faint">{i.p}</span> · deleted {i.t}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-accent">{i.s}</span>
                          <button onClick={() => handleAction(`Restored ${i.n} to ${i.p}`)} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md cursor-pointer">
                            <RotateCcw className="w-3 h-3" />Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* DUPLICATES */}
                {activeTab === 'duplicates' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">Duplicate Files</h4>
                        <p className="text-xs text-muted">Exact matches by BLAKE3 hash. Keep one copy, trash the rest. 3 groups · 2.4 GB wasted</p>
                      </div>
                      <button onClick={() => handleAction('Moved 4 duplicate files to Trash')} className="px-4 py-2 text-xs font-bold text-black bg-accent hover:bg-accent/80 rounded-lg transition-colors cursor-pointer shrink-0">
                        Trash Duplicates
                      </button>
                    </div>
                    {[
                      { n: 'ubuntu-22.04.iso', c: 3, s: '1.4 GB', p: ['~/Downloads', '~/Desktop/old', '~/vm-images'] },
                      { n: 'dataset-v2.zip', c: 2, s: '640 MB', p: ['~/ml/data', '~/backups'] },
                      { n: 'intro-video.mp4', c: 2, s: '380 MB', p: ['~/Videos', '~/projects/site/public'] },
                    ].map((g) => (
                      <div key={g.n} className="p-3 rounded-xl bg-panel-2 border border-white/[0.06]">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-mono font-bold text-white">{g.n} <span className="text-muted font-sans font-normal">· {g.c} copies</span></div>
                          <div className="text-xs font-mono font-bold text-accent">{g.s} each</div>
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          {g.p.map((x, i) => (
                            <div key={x} className="text-[11px] font-mono text-faint">{i === 0 ? '✓ keep ' : '✕ trash '}{x}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* VIDEOS */}
                {activeTab === 'videos' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">Videos</h4>
                        <p className="text-xs text-muted">Largest video files on your disk. 5 found · 9.7 GB</p>
                      </div>
                      <button onClick={() => handleAction('Moved selected videos to Trash')} className="px-4 py-2 text-xs font-bold text-black bg-accent hover:bg-accent/80 rounded-lg transition-colors cursor-pointer shrink-0">
                        Move Selected to Trash
                      </button>
                    </div>
                    {[
                      ['screen-recording-2024-03.mov', '3.8 GB', '~/Movies'],
                      ['demo-final-v7.mp4', '2.6 GB', '~/projects/launch'],
                      ['webinar-recording.mkv', '1.9 GB', '~/Downloads'],
                      ['onboarding-raw.mp4', '980 MB', '~/Desktop'],
                    ].map(([n, sz, path]) => (
                      <div key={n} className="p-3 rounded-xl bg-panel-2 border border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Film className="w-4 h-4 text-accent" />
                          <div>
                            <div className="text-xs font-mono font-bold text-white">{n}</div>
                            <div className="text-[11px] font-mono text-faint">{path}</div>
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-accent">{sz}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SETTINGS (mirrors the app: roots, patterns, ignore rules, behaviour) */}
                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">Settings</h4>
                      <p className="text-xs text-muted">Control scan roots, enabled patterns, ignored folders and deletion behavior.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">Scan folders</div>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-accent"><Plus className="w-3 h-3" />Add folder</span>
                      </div>
                      {['~/projects', '~/work', 'D:\\dev'].map((r) => (
                        <div key={r} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-background border border-white/[0.06] text-xs font-mono text-muted">
                          <span className="flex items-center gap-2"><FolderOpen className="w-3.5 h-3.5 text-accent" />{r}</span>
                          <X className="w-3 h-3 text-faint" />
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] space-y-2">
                      <div className="text-xs font-bold text-white">Scan patterns</div>
                      <div className="flex flex-wrap gap-1.5">
                        {['node_modules', 'target', '.next', 'dist', 'build', '.venv', '__pycache__', '.gradle', 'Pods'].map((x, i) => (
                          <span key={x} className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${i < 7 ? 'bg-accent/15 border-accent/40 text-white' : 'bg-background border-white/10 text-muted'}`}>{x}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] space-y-2">
                      <div className="text-xs font-bold text-white">Ignore rules</div>
                      <div className="flex flex-wrap gap-1.5">
                        {['important-project', 'client-work/legacy'].map((x) => (
                          <span key={x} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-background border border-white/10 text-muted">{x}<X className="w-3 h-3 text-faint" /></span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-panel-2 border border-white/[0.06] space-y-3">
                      <div className="text-xs font-bold text-white">Cleanup behavior</div>
                      {[
                        ['Move to Recycle Bin / Trash (recommended)', 'Items stay restorable until you empty the bin'],
                        ['Confirm before cleaning', 'Review the list and total size first'],
                        ['Include extended patterns', 'Also scan .gradle, Pods, .terraform and more'],
                      ].map(([t, d], i) => (
                        <label key={t} className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked={i < 2} className="accent-accent mt-0.5 w-4 h-4 rounded cursor-pointer" />
                          <span>
                            <span className="block text-xs font-semibold text-white">{t}</span>
                            <span className="block text-[11px] text-muted">{d}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ABOUT */}
                {activeTab === 'about' && (
                  <div className="p-6 rounded-xl bg-panel-2 border border-white/[0.06] space-y-4">
                    <div className="flex items-center gap-3">
                      <CodeShredderIcon size={40} />
                      <div>
                        <h4 className="text-base font-extrabold text-white">CodeShredder</h4>
                        <div className="text-xs text-muted">Version {siteConfig.version} · Tauri 2 + Rust</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      A fast, safe cleanup app for developers. It finds heavy generated folders, caches, WSL bloat, large files and duplicates, then moves what you pick to the Trash. Everything runs locally with no accounts, analytics or network calls.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[['Windows', '10 / 11'], ['macOS', '12+'], ['Linux', 'AppImage · deb · rpm']].map(([a, b]) => (
                        <div key={a} className="p-2.5 rounded-lg bg-background border border-white/[0.06]">
                          <div className="text-xs font-bold text-white">{a}</div>
                          <div className="text-[10px] text-muted">{b}</div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                      <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">GitHub Repository</a>
                      <span className="text-faint">·</span>
                      <a href={siteConfig.releasesUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">Release notes</a>
                      <span className="text-faint">·</span>
                      <span className="text-faint">MIT License</span>
                    </div>
                  </div>
                )}

                {/* Table Bottom Action Bar (in scan view) */}
                {activeTab === 'shred' && (
                  <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">
                        {selectedIds.length} items selected
                      </span>
                      <span className="text-sm font-bold font-mono text-accent tabular-nums">
                        {formattedSelectedSize}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction('Safely moved selected files to OS Trash!')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-panel-2 hover:bg-[#222E37] border border-accent/40 hover:border-accent transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-accent" />
                        <span>Move to Trash</span>
                        <ChevronDown className="w-3 h-3 text-muted" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Toast Notice */}
                {actionNotice && (
                  <div className="mt-3 py-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{actionNotice}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
