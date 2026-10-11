import React from 'react';
import { Download } from 'lucide-react';
import { GitHubIcon, RustIcon } from './BrandIcons';
import { HeroIllustration } from './HeroIllustration';
import { siteConfig } from '../config/site';

interface HeroProps {
  onDownloadClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onDownloadClick }) => {
  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-[#080A0B]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-6 flex flex-col items-start z-10">
            {/* Eyebrow Badges Strip */}
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#FF8A24] bg-[#FF702B]/10 border border-[#FF702B]/30">
                <RustIcon className="w-3.5 h-3.5 text-[#FF702B]" />
                Built with Rust
              </span>
              <div className="flex items-center gap-2 text-xs font-medium text-[#A7ADB4]">
                <span>Fast</span>
                <span className="text-[#747D85]">·</span>
                <span>Safe</span>
                <span className="text-[#747D85]">·</span>
                <span>Open Source</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-white leading-[1.08] mb-6 max-w-xl text-balance">
              Free your space{' '}
              <span className="text-[#FF702B] drop-shadow-[0_0_28px_rgba(255,112,43,0.4)]">
                for what matters.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#A7ADB4] leading-relaxed mb-8 max-w-xl">
              CodeShredder is a fast, safe desktop cleanup app for developers and power users.
              It finds laptop junk, code junk, dependency folders, build artifacts, caches, and WSL
              bloat — and helps you remove them safely through a beautiful desktop app.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                onClick={onDownloadClick}
                className="flex items-center gap-3 px-7 py-3.5 sm:py-4 text-base font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] active:scale-[0.98] rounded-xl transition-all duration-150 shadow-[0_0_28px_rgba(255,112,43,0.4)] cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Download for Windows</span>
              </button>

              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3.5 sm:py-4 text-base font-semibold text-white bg-[#12191E] hover:bg-[#1A232A] border border-white/10 hover:border-white/20 rounded-xl transition-colors"
              >
                <GitHubIcon className="w-5 h-5" />
                <span>View on GitHub</span>
              </a>
            </div>

            {/* Supporting Metadata */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#747D85]">
              <span>Also available for macOS and Linux</span>
              <span className="hidden sm:inline">|</span>
              <span>Open source</span>
              <span className="hidden sm:inline">|</span>
              <span>No telemetry</span>
            </div>
          </div>

          {/* Right Column: Custom Brand Illustration */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};
