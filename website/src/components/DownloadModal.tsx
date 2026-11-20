import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, ShieldCheck, Terminal, Github } from 'lucide-react';
import { PLATFORM_ICON } from './DownloadButton';
import { siteConfig, platformDownload } from '../config/site';
import { PLATFORMS, type Platform } from '../lib/platform';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlatform?: Platform;
}

const BUILD_FROM_SOURCE = 'git clone https://github.com/akshad-exe/CodeShredder && cd CodeShredder && bun install && bun run tauri:build';

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  selectedPlatform = 'Windows',
}) => {
  const [platform, setPlatform] = useState<Platform>(selectedPlatform);

  useEffect(() => setPlatform(selectedPlatform), [selectedPlatform, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const download = platformDownload(platform);
  const PlatformIcon = PLATFORM_ICON[download.platform];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Download CodeShredder"
        className="bg-panel border border-white/15 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Download CodeShredder</h3>
            <p className="text-xs text-muted">
              Latest build: <span className="font-mono text-white">{siteConfig.version}</span> · Open Source
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4" role="tablist" aria-label="Platform">
          {PLATFORMS.map((p) => {
            const Icon = PLATFORM_ICON[p];
            return (
              <button
                key={p}
                role="tab"
                aria-selected={p === platform}
                onClick={() => setPlatform(p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  p === platform
                    ? 'bg-accent/15 border-accent/40 text-white'
                    : 'bg-panel-2 border-white/10 text-muted hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {p}
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          {/* Platform Release Card */}
          <div className="p-4 rounded-xl bg-panel-2 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <PlatformIcon className="w-4 h-4 text-accent" />
                <span>{download.platform}</span>
              </div>
              <span className="text-xs font-mono text-muted">
                {download.assets.length} {download.assets.length === 1 ? 'asset' : 'assets'}
              </span>
            </div>

            <p className="text-xs text-muted">
              {download.requirements}. Built natively with Rust &amp; Tauri.
            </p>

            <ul className="pt-1 space-y-2">
              {download.assets.map((asset) => (
                <li key={asset.filename}>
                  <a
                    href={asset.url}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-sidebar border border-white/[0.06] hover:border-accent/50 transition-colors group"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Download className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-white">
                          {asset.label}
                        </span>
                        <span className="block text-[11px] font-mono text-faint truncate">
                          {asset.filename}
                        </span>
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-muted shrink-0">
                      {asset.size}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="pt-1 flex flex-wrap gap-2.5">
              <a
                href={siteConfig.releasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-accent hover:bg-accent/80 rounded-lg transition-all shadow-[0_0_15px_rgba(255,112,43,0.3)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {download.platform}</span>
              </a>
              <a
                href={siteConfig.releasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              >
                <span>All Assets &amp; Checksums</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Build from source */}
          <div className="p-3.5 rounded-xl bg-sidebar border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Terminal className="w-3.5 h-3.5 text-accent" />
              <span>Or build from source:</span>
            </div>
            <div className="p-2 rounded-lg bg-black font-mono text-xs text-accent overflow-x-auto select-all">
              {BUILD_FROM_SOURCE}
            </div>
          </div>

          {/* Safety & Trash Notice */}
          <div className="flex items-start gap-2.5 text-xs text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              CodeShredder never deletes files permanently without user consent. Selected items are moved
              safely to the Recycle Bin / Trash so you can restore them.
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.06] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-muted hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};