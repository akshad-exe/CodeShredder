import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Database,
  Terminal,
  FileText,
  Copy,
  LayoutGrid,
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
  const [activeTab, setActiveTab] = useState<'scan' | 'shred' | 'caches' | 'wsl' | 'large_files' | 'duplicates' | 'treemap' | 'settings' | 'about'>('scan');
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
        <div className="relative rounded-3xl p-3 sm:p-6 lg:p-10 border border-white/[0.08] bg-[#0A0D10] overflow-hidden shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)]">
          {/* Background mountain ambient twilight scenery behind the window */}
          <div className="absolute inset-0 -z-10 opacity-30">
            <img
              src={ctaMountainImg}
              alt="Mountain landscape background"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter blur-xs"
            />
            <div className="absolute inset-0 bg-[#080A0B]/80" />
          </div>

          {/* Desktop App Window Container */}
          <div className="rounded-2xl border border-white/[0.12] bg-[#0E1418] shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Window Title Bar */}
            <div className="h-11 bg-[#0A0E11] px-4 flex items-center justify-between border-b border-white/[0.06] select-none">
              {/* macOS Traffic Lights */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
              </div>

              {/* Window Title Center */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#8A929A]">
                <CodeShredderIcon size={16} />
                <span>CodeShredder — Desktop Clean Utility (v0.9.4)</span>
              </div>

              {/* Windows Window Controls */}
              <div className="flex items-center gap-3 text-[#747D85] text-xs">
                <span className="hover:text-white cursor-pointer px-1">—</span>
                <span className="hover:text-white cursor-pointer px-1">□</span>
                <span className="hover:text-white cursor-pointer px-1">✕</span>
              </div>
            </div>

            {/* Window Inner Layout (Sidebar + Main View) */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
              {/* Sidebar */}
              <div className="md:col-span-3 lg:col-span-3 bg-[#0A0E11] border-r border-white/[0.06] p-4 flex flex-col justify-between">
                <div>
                  {/* Sidebar Brand Header */}
                  <div className="flex items-center gap-2.5 px-2 py-2 mb-4">
                    <CodeShredderIcon size={24} />
                    <span className="text-base font-extrabold text-white tracking-tight">
                      Code<span className="text-[#FF702B]">Shredder</span>
                    </span>
                  </div>

                  {/* Active / Search Tab */}
                  <button
                    onClick={() => setActiveTab('scan')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold mb-3 transition-colors cursor-pointer ${
                      activeTab === 'scan'
                        ? 'bg-[#FF702B]/20 text-[#FF8A24] border border-[#FF702B]/40'
                        : 'text-[#A7ADB4] hover:bg-white/[0.04]'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>Scan</span>
                  </button>

                  {/* Sidebar Navigation Items */}
                  <nav className="space-y-1">
                    {[
                      { id: 'shred', label: 'Shred', icon: <Trash2 className="w-4 h-4" /> },
                      { id: 'caches', label: 'Caches', icon: <Database className="w-4 h-4" /> },
                      { id: 'wsl', label: 'WSL', icon: <Terminal className="w-4 h-4" /> },
                      { id: 'large_files', label: 'Large Files', icon: <FileText className="w-4 h-4" /> },
                      { id: 'duplicates', label: 'Duplicates', icon: <Copy className="w-4 h-4" /> },
                      { id: 'treemap', label: 'Treemap', icon: <LayoutGrid className="w-4 h-4" /> },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          activeTab === item.id
                            ? 'bg-white/[0.08] text-white font-semibold'
                            : 'text-[#A7ADB4] hover:bg-white/[0.03] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {(item.id === 'duplicates' || item.id === 'treemap') && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-white/5 text-[#747D85]">
                            Soon
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Sidebar Bottom Items */}
                <div className="pt-4 border-t border-white/[0.06] space-y-1">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-white/[0.08] text-white font-semibold'
                        : 'text-[#A7ADB4] hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === 'about'
                        ? 'bg-white/[0.08] text-white font-semibold'
                        : 'text-[#A7ADB4] hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    <span>About</span>
                  </button>
                </div>
              </div>

              {/* Main Panel Viewport */}
              <div className="md:col-span-9 lg:col-span-9 p-4 sm:p-6 flex flex-col justify-between bg-[#11171B]">
                {/* 1. SCAN VIEW (Default Showcase) */}
                {activeTab === 'scan' && (
                  <div>
                    {/* Scan Complete Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#141C22] border border-white/[0.06] mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            Scan Complete
                          </h4>
                          <p className="text-xs text-[#A7ADB4]">
                            Found 12.4 GB of reclaimable space
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAction('Shredding selected 12.4 GB...')}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] rounded-lg transition-all shadow-[0_0_15px_rgba(255,112,43,0.3)] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Shred Selected</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 4 Summary Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Box className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">1.2 GB</div>
                          <div className="text-[11px] text-[#A7ADB4]">Dependencies</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">4.8 GB</div>
                          <div className="text-[11px] text-[#A7ADB4]">Build Artifacts</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">2.1 GB</div>
                          <div className="text-[11px] text-[#A7ADB4]">Caches</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                          <LinuxIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">4.3 GB</div>
                          <div className="text-[11px] text-[#A7ADB4]">WSL</div>
                        </div>
                      </div>
                    </div>

                    {/* File Results Table */}
                    <div className="rounded-xl border border-white/[0.06] bg-[#141C22] overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-[#747D85] font-semibold">
                            <th className="py-2.5 px-3 w-8">
                              <button
                                onClick={toggleSelectAll}
                                className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-colors ${
                                  selectedIds.length === initialFiles.length
                                    ? 'bg-[#FF702B] text-black'
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
                                        ? 'bg-[#FF702B] text-black'
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
                                <td className="py-2.5 px-3 font-mono text-[#A7ADB4] tabular-nums">
                                  {file.sizeStr}
                                </td>
                                <td className="py-2.5 px-3 text-[#A7ADB4]">
                                  {file.type}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[#747D85] truncate max-w-[180px]">
                                  {file.path}
                                </td>
                                <td className="py-2.5 px-3 text-[#747D85]">
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

                {/* 2. SHRED VIEW */}
                {activeTab === 'shred' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Active Shredding Targets</h4>
                        <p className="text-xs text-[#A7ADB4]">Immediate cleanup of node_modules, build outputs, and targets</p>
                      </div>
                      <button
                        onClick={() => handleAction('Shredded 4.1 GB of build artifacts safely to Trash!')}
                        className="px-4 py-2 text-xs font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] rounded-lg transition-colors cursor-pointer"
                      >
                        Shred All Targets
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { name: 'frontend-app/node_modules', size: '1.4 GB', path: 'D:/code/frontend-app/node_modules', reason: 'Unused dependencies (project inactive 90 days)' },
                        { name: 'rust-engine/target', size: '920 MB', path: 'D:/code/rust-engine/target/debug', reason: 'Debug binaries and intermediate compiler objects' },
                        { name: 'api-service/.next', size: '1.2 GB', path: 'D:/code/api-service/.next/cache', reason: 'Stale Next.js compilation cache' },
                        { name: 'ml-scripts/.venv', size: '460 MB', path: 'D:/code/ml-scripts/.venv', reason: 'Virtualenv wheels and cached site-packages' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
                          <div>
                            <div className="text-xs font-mono font-bold text-white">{item.name}</div>
                            <div className="text-[11px] text-[#A7ADB4]">{item.reason}</div>
                            <div className="text-[10px] font-mono text-[#747D85]">{item.path}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-bold text-[#FF8A24]">{item.size}</div>
                            <button
                              onClick={() => handleAction(`Moved ${item.name} to Trash`)}
                              className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer mt-1"
                            >
                              Shred to Trash
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. CACHES PAGE */}
                {activeTab === 'caches' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center text-[#A5B4FC]">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Runtime & Package Caches</h4>
                          <p className="text-xs text-[#A7ADB4]">2.1 GB of cached packages safe to purge (re-downloaded on demand)</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAction('Purged 2.1 GB of package caches!')}
                        className="px-4 py-2 text-xs font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] rounded-lg transition-colors cursor-pointer"
                      >
                        Purge All Caches (2.1 GB)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06]">
                        <div className="text-xs text-[#A7ADB4]">npm / yarn</div>
                        <div className="text-base font-mono font-bold text-white mt-1">840 MB</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06]">
                        <div className="text-xs text-[#A7ADB4]">Cargo Crates</div>
                        <div className="text-base font-mono font-bold text-white mt-1">620 MB</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06]">
                        <div className="text-xs text-[#A7ADB4]">pip / uv</div>
                        <div className="text-base font-mono font-bold text-white mt-1">310 MB</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06]">
                        <div className="text-xs text-[#A7ADB4]">Go build</div>
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
                        <div key={cache.id} className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
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
                              className="accent-[#FF702B] rounded cursor-pointer"
                            />
                            <div>
                              <div className="text-xs font-mono font-bold text-white">{cache.name}</div>
                              <div className="text-[11px] text-[#A7ADB4]">{cache.desc}</div>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold text-[#FF8A24]">{cache.size}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. WSL MANAGER PAGE */}
                {activeTab === 'wsl' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E95420]/15 border border-[#E95420]/30 flex items-center justify-center text-[#E95420]">
                          <WslIcon className="w-5 h-5 text-[#E95420]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">WSL2 Virtual Disk Reclaimer</h4>
                          <p className="text-xs text-[#A7ADB4]">Compact ext4.vhdx virtual disks that grow dynamically but never shrink</p>
                        </div>
                      </div>

                      <button
                        onClick={handleCompactWsl}
                        disabled={wslCompacting || wslCompacted}
                        className="px-4 py-2 text-xs font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] disabled:opacity-60 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                      >
                        {wslCompacting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-[#080A0B] border-t-transparent rounded-full animate-spin" />
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
                    <div className="p-4 rounded-xl bg-[#141C22] border border-white/[0.06] space-y-3">
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
                          <div className="text-[10px] text-[#747D85]">Host Size on Windows</div>
                          <div className="font-mono font-bold text-white mt-0.5">
                            {wslCompacted ? '40.9 GB' : '45.2 GB'}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40">
                          <div className="text-[10px] text-[#747D85]">Real Size inside Linux</div>
                          <div className="font-mono font-bold text-white mt-0.5">12.8 GB</div>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40">
                          <div className="text-[10px] text-[#747D85]">Free Space inside VHD</div>
                          <div className="font-mono font-bold text-[#FF8A24] mt-0.5">
                            {wslCompacted ? '0.2 GB' : '4.3 GB'}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-[#747D85] truncate">
                        C:\Users\Developer\AppData\Local\Packages\CanonicalGroupLimited...\LocalState\ext4.vhdx
                      </div>
                    </div>

                    {/* How WSL compaction works banner */}
                    <div className="p-3.5 rounded-xl bg-[#10171C] border border-[#FF702B]/20 flex items-start gap-3 text-xs text-[#A7ADB4]">
                      <Info className="w-4 h-4 text-[#FF702B] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Why WSL disks bloat:</span> WSL2 virtual disks expand dynamically when you download packages or build docker images, but deleting files in Linux does not shrink the .vhdx on Windows. CodeShredder shuts down WSL and executes diskpart compact to reclaim space immediately.
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. LARGE FILES PAGE */}
                {activeTab === 'large_files' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Large File Explorer (&gt; 50 MB)</h4>
                        <p className="text-xs text-[#A7ADB4]">Found 22.1 GB of large binaries, disk images, and archives</p>
                      </div>
                      <button
                        onClick={() => handleAction('Safely moved selected large files to Trash')}
                        className="px-4 py-2 text-xs font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] rounded-lg transition-colors cursor-pointer"
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
                        <div key={item.id} className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
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
                              className="accent-[#FF702B] rounded cursor-pointer"
                            />
                            <div>
                              <div className="text-xs font-mono font-bold text-white">{item.name}</div>
                              <div className="text-[11px] text-[#A7ADB4]">{item.type} · <span className="font-mono text-[#747D85]">{item.path}</span></div>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-bold text-[#FF8A24]">{item.size}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. DUPLICATES (Preview) */}
                {activeTab === 'duplicates' && (
                  <div className="p-6 rounded-xl bg-[#141C22] border border-white/[0.06] text-center space-y-3">
                    <Copy className="w-8 h-8 text-[#FF702B] mx-auto opacity-80" />
                    <h4 className="text-base font-bold text-white">Duplicate File Detector</h4>
                    <p className="text-xs text-[#A7ADB4] max-w-md mx-auto">
                      Scan folders for exact binary hash duplicates (SHA-256) across multiple clone repositories and downloads.
                    </p>
                    <div className="pt-2">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FF702B]/20 text-[#FF8A24] border border-[#FF702B]/30">
                        Feature coming in v0.9.5
                      </span>
                    </div>
                  </div>
                )}

                {/* 7. TREEMAP (Preview) */}
                {activeTab === 'treemap' && (
                  <div className="p-6 rounded-xl bg-[#141C22] border border-white/[0.06] text-center space-y-3">
                    <LayoutGrid className="w-8 h-8 text-[#FF702B] mx-auto opacity-80" />
                    <h4 className="text-base font-bold text-white">Visual Disk Treemap</h4>
                    <p className="text-xs text-[#A7ADB4] max-w-md mx-auto">
                      Interactive nested treemap visualization of disk occupancy, powered by Rust walkdir and WebGL.
                    </p>
                    <div className="pt-2">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FF702B]/20 text-[#FF8A24] border border-[#FF702B]/30">
                        Feature coming in v0.9.5
                      </span>
                    </div>
                  </div>
                )}

                {/* 8. SETTINGS VIEW */}
                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#141C22] border border-white/[0.06]">
                      <h4 className="text-sm font-bold text-white mb-1">Safety & Shredding Preferences</h4>
                      <p className="text-xs text-[#A7ADB4]">Configure how CodeShredder handles file deletions</p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">Always Move to OS Trash (Recommended)</div>
                          <div className="text-[11px] text-[#A7ADB4]">Files can be restored immediately from Windows Recycle Bin</div>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-[#FF702B] w-4 h-4 rounded cursor-pointer" />
                      </div>

                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">Ask Confirmation Before Shredding &gt; 1 GB</div>
                          <div className="text-[11px] text-[#A7ADB4]">Safety warning dialog for massive folder deletions</div>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-[#FF702B] w-4 h-4 rounded cursor-pointer" />
                      </div>

                      <div className="p-3 rounded-xl bg-[#141C22] border border-white/[0.06] flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">Protect .git and .env Folders</div>
                          <div className="text-[11px] text-[#A7ADB4]">Never touch version control metadata or environment files</div>
                        </div>
                        <input type="checkbox" defaultChecked className="accent-[#FF702B] w-4 h-4 rounded cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. ABOUT VIEW */}
                {activeTab === 'about' && (
                  <div className="p-6 rounded-xl bg-[#141C22] border border-white/[0.06] space-y-4">
                    <div className="flex items-center gap-3">
                      <CodeShredderIcon size={36} />
                      <div>
                        <h4 className="text-base font-extrabold text-white">CodeShredder Desktop</h4>
                        <div className="text-xs text-[#A7ADB4]">Version 0.9.4-beta (x64) · Tauri 2.0 + Rust</div>
                      </div>
                    </div>

                    <p className="text-xs text-[#A7ADB4] leading-relaxed">
                      CodeShredder is a high-performance desktop cleanup utility created for developers. Built with memory safety and speed in Rust, running 100% locally with zero analytics, telemetry, or network transmission.
                    </p>

                    <div className="pt-2 flex items-center gap-3 text-xs">
                      <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF702B] hover:underline font-semibold">
                        GitHub Repository
                      </a>
                      <span className="text-[#747D85]">·</span>
                      <span className="text-[#747D85]">MIT License</span>
                      <span className="text-[#747D85]">·</span>
                      <span className="text-[#747D85]">Built with Rust 1.82</span>
                    </div>
                  </div>
                )}

                {/* Table Bottom Action Bar (in scan view) */}
                {activeTab === 'scan' && (
                  <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#A7ADB4]">
                        {selectedIds.length} items selected
                      </span>
                      <span className="text-sm font-bold font-mono text-[#FF702B] tabular-nums">
                        {formattedSelectedSize}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction('Safely moved selected files to OS Trash!')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#1A232A] hover:bg-[#222E37] border border-[#FF702B]/40 hover:border-[#FF702B] transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#FF702B]" />
                        <span>Move to Trash</span>
                        <ChevronDown className="w-3 h-3 text-[#A7ADB4]" />
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
