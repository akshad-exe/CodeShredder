import React from 'react';
import { X, Download, ExternalLink, ShieldCheck, Terminal, Github } from 'lucide-react';
import { WindowsIcon, AppleIcon, LinuxIcon } from './BrandIcons';
import { siteConfig, platformDownload, type PlatformDownload } from '../config/site';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlatform?: 'Windows' | 'macOS' | 'Linux';
}

const PLATFORM_ICON: Record<PlatformDownload['platform'], React.FC<{ className?: string }>> = {
  Windows: WindowsIcon,
  macOS: AppleIcon,
  Linux: LinuxIcon,
};

const BUILD_FROM_SOURCE = 'git clone https://github.com/akshad-exe/CodeShredder && cd CodeShredder && bun install && bun run tauri:build';

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  selectedPlatform = 'Windows',
}) => {
  if (!isOpen) return null;

  const download = platformDownload(selectedPlatform);
  const PlatformIcon = PLATFORM_ICON[download.platform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#11171B] border border-white/15 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A7ADB4] hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FF702B]/20 border border-[#FF702B]/30 flex items-center justify-center text-[#FF702B]">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Download CodeShredder</h3>
            <p className="text-xs text-[#A7ADB4]">
              Latest build: <span className="font-mono text-white">{siteConfig.version}</span> · Open Source
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Platform Release Card */}
          <div className="p-4 rounded-xl bg-[#161F25] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <PlatformIcon className="w-4 h-4 text-[#38BDF8]" />
                <span>{download.platform}</span>
              </div>
              <span className="text-xs font-mono text-[#A7ADB4]">
                {download.assets.length} {download.assets.length === 1 ? 'asset' : 'assets'}
              </span>
            </div>

            <p className="text-xs text-[#A7ADB4]">
              {download.requirements}. Built natively with Rust &amp; Tauri.
            </p>

            <ul className="pt-1 space-y-2">
              {download.assets.map((asset) => (
                <li key={asset.filename}>
                  <a
                    href={asset.url}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0D1215] border border-white/[0.06] hover:border-[#FF702B]/50 transition-colors group"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Download className="w-3.5 h-3.5 text-[#FF702B] shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-white">
                          {asset.label}
                        </span>
                        <span className="block text-[11px] font-mono text-[#747D85] truncate">
                          {asset.filename}
                        </span>
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-[#A7ADB4] shrink-0">
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
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] rounded-lg transition-all shadow-[0_0_15px_rgba(255,112,43,0.3)]"
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
          <div className="p-3.5 rounded-xl bg-[#0D1215] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Terminal className="w-3.5 h-3.5 text-[#FF702B]" />
              <span>Or build from source:</span>
            </div>
            <div className="p-2 rounded-lg bg-black font-mono text-xs text-[#FF8A24] overflow-x-auto select-all">
              {BUILD_FROM_SOURCE}
            </div>
          </div>

          {/* Safety & Trash Notice */}
          <div className="flex items-start gap-2.5 text-xs text-[#A7ADB4]">
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
            className="px-4 py-1.5 text-xs font-medium text-[#A7ADB4] hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};