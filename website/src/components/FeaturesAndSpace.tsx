import React, { useState } from 'react';
import {
  Compass,
  ShieldCheck,
  Wrench,
  GitFork,
  Trash2,
  Layers,
  Box,
  Database,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { LinuxIcon, GitHubIcon } from './BrandIcons';
import { CodeShredderIcon } from './CodeShredderIcon';

export const FeaturesAndSpace: React.FC = () => {
  const [shreddingState, setShreddingState] = useState<'idle' | 'shredding' | 'done'>('idle');

  const handleSimulateShred = () => {
    if (shreddingState !== 'idle') return;
    setShreddingState('shredding');
    setTimeout(() => {
      setShreddingState('done');
      setTimeout(() => setShreddingState('idle'), 4000);
    }, 1200);
  };

  const features = [
    {
      title: 'Fast Scans',
      description: 'Find junk in seconds',
      icon: <Compass className="w-5 h-5 text-white" />,
    },
    {
      title: 'Safe by Default',
      description: 'Moves to Trash, not permanent delete',
      icon: <ShieldCheck className="w-5 h-5 text-[#FF8A24]" />,
    },
    {
      title: 'Developer Focused',
      description: 'Knows your tools and folders',
      icon: <Wrench className="w-5 h-5 text-white" />,
    },
    {
      title: 'Open Source',
      description: 'Built with Rust, for everyone',
      icon: <GitHubIcon className="w-5 h-5 text-white" />,
    },
  ];

  const breakdown = [
    {
      label: 'Dependencies',
      size: '4.8 GB',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
    },
    {
      label: 'Build Artifacts',
      size: '2.1 GB',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      icon: <Box className="w-4 h-4 text-purple-400" />,
    },
    {
      label: 'Caches',
      size: '1.2 GB',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      icon: <Database className="w-4 h-4 text-cyan-400" />,
    },
    {
      label: 'WSL',
      size: '4.3 GB',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10 border-pink-500/20',
      icon: <LinuxIcon className="w-4 h-4 text-pink-400" />,
    },
    {
      label: 'Large Files',
      size: '892 MB',
      color: 'text-gray-300',
      bgColor: 'bg-white/10 border-white/15',
      icon: <FileText className="w-4 h-4 text-gray-300" />,
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Heading, Subtitle & 4 Features */}
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-tight mb-5 text-balance">
              A cleaner machine for<br />a better you.
            </h2>
            <p className="text-base sm:text-lg text-[#A7ADB4] leading-relaxed mb-10 max-w-xl">
              Developers create a lot of junk. CodeShredder helps you find it,
              understand it, and remove it safely — so you can get back to building.
            </p>

            {/* 4 Feature blocks in a 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {features.map((feat, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#161D22] border border-white/10 flex items-center justify-center shrink-0">
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-[#A7ADB4] leading-snug">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Reclaimable Space Dashboard Preview */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-[#11171B] border border-white/[0.08] p-6 sm:p-7 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)]">
              {/* Header */}
              <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-white/[0.06]">
                <div className="w-11 h-11 rounded-full bg-[#FF702B]/15 border border-[#FF702B]/30 flex items-center justify-center shrink-0">
                  <CodeShredderIcon size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Reclaim your space
                  </h3>
                  <p className="text-xs text-[#A7ADB4]">
                    We found <span className="font-semibold text-white">12.4 GB</span> of reclaimable space
                  </p>
                </div>
              </div>

              {/* Category Breakdown Rows */}
              <div className="space-y-3.5 mb-7">
                {breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-1 rounded-lg hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-md border flex items-center justify-center ${item.bgColor}`}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-medium text-[#A7ADB4] tabular-nums">
                      {item.size}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={handleSimulateShred}
                disabled={shreddingState === 'shredding'}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] active:scale-[0.99] transition-all duration-150 shadow-[0_0_20px_rgba(255,112,43,0.3)] cursor-pointer disabled:opacity-75"
              >
                {shreddingState === 'idle' && (
                  <>
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Shred Selected</span>
                  </>
                )}
                {shreddingState === 'shredding' && (
                  <div className="flex items-center gap-2 text-[#080A0B]">
                    <div className="w-4 h-4 border-2 border-[#080A0B] border-t-transparent rounded-full animate-spin" />
                    <span>Moving to OS Trash...</span>
                  </div>
                )}
                {shreddingState === 'done' && (
                  <div className="flex items-center gap-1.5 text-[#080A0B]">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>12.4 GB Moved to Trash!</span>
                  </div>
                )}
              </button>

              <div className="mt-3 text-center">
                <span className="text-[11px] text-[#747D85]">
                  Illustrative desktop dashboard preview · Non-destructive
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
