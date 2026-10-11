import React from 'react';
import { WindowsIcon, AppleIcon, LinuxIcon } from './BrandIcons';
import ctaMountainImg from '../assets/images/cta_mountain_sunset_1791697159659.jpg';

interface DownloadCTAProps {
  onDownloadClick: () => void;
  onPlatformClick: (platform: string) => void;
}

export const DownloadCTA: React.FC<DownloadCTAProps> = ({
  onDownloadClick,
  onPlatformClick,
}) => {
  return (
    <section id="download" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background Mountain Sunset Scenery with Rich Gradients */}
      <div className="absolute inset-0 -z-10">
        <img
          src={ctaMountainImg}
          alt="Sunset mountains silhouette"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        {/* Darkening & Warm Atmosphere Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0B] via-[#080A0B]/40 to-[#080A0B]" />
        <div className="absolute inset-0 bg-[#080A0B]/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF702B]/10 to-transparent mix-blend-color-dodge pointer-events-none" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Eyebrow */}
        <div className="text-xs sm:text-sm font-bold tracking-[0.2em] text-[#FF8A24] uppercase mb-4 drop-shadow-md">
          CLEAN TODAY. BUILD TOMORROW.
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Download Code<span className="text-[#FF702B]">Shredder</span>
        </h2>

        {/* Supporting text */}
        <p className="text-base sm:text-lg text-[#F5F5F5]/80 max-w-xl mx-auto mb-10 leading-relaxed drop-shadow-md">
          Join developers who keep their machines clean and focused.
        </p>

        {/* 3 Platform Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mx-auto">
          {/* Windows Download Button */}
          <button
            onClick={onDownloadClick}
            className="flex items-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] active:scale-[0.98] transition-all duration-150 shadow-[0_0_35px_rgba(255,112,43,0.5)] cursor-pointer"
          >
            <WindowsIcon className="w-5 h-5 text-[#080A0B]" />
            <span>Download for Windows</span>
          </button>

          {/* macOS Button (Soon) */}
          <button
            onClick={() => onPlatformClick('macOS')}
            className="flex items-center gap-2.5 px-6 py-4 rounded-xl text-base font-semibold text-white bg-[#11171B]/85 hover:bg-[#182126] border border-white/15 hover:border-white/30 backdrop-blur-md transition-all cursor-pointer"
          >
            <AppleIcon className="w-5 h-5 text-white" />
            <span>macOS (Soon)</span>
          </button>

          {/* Linux Button (Soon) */}
          <button
            onClick={() => onPlatformClick('Linux')}
            className="flex items-center gap-2.5 px-6 py-4 rounded-xl text-base font-semibold text-white bg-[#11171B]/85 hover:bg-[#182126] border border-white/15 hover:border-white/30 backdrop-blur-md transition-all cursor-pointer"
          >
            <LinuxIcon className="w-5 h-5 text-white" />
            <span>Linux (Soon)</span>
          </button>
        </div>
      </div>
    </section>
  );
};
