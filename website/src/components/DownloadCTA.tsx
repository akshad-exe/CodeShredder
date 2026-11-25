import React from 'react';
import { DownloadButton, PLATFORM_ICON, downloadHref, useDetectedPlatform } from './DownloadButton';
import { PLATFORMS } from '../lib/platform';
import { ReleaseNote } from './ReleaseNote';
import ctaMountainImg from '../assets/images/cta_mountain_sunset.webp';

export const DownloadCTA: React.FC = () => {
  const detected = useDetectedPlatform();
  const others = PLATFORMS.filter((p) => p !== detected);
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background" />
        <div className="absolute inset-0 bg-background/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/10 to-transparent mix-blend-color-dodge pointer-events-none" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Eyebrow */}
        <div className="text-xs sm:text-sm font-bold tracking-[0.2em] text-accent uppercase mb-4 drop-shadow-md">
          CLEAN TODAY. BUILD TOMORROW.
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Download Code<span className="text-accent">Shredder</span>
        </h2>

        {/* Supporting text */}
        <p className="text-base sm:text-lg text-text/80 max-w-xl mx-auto mb-10 leading-relaxed drop-shadow-md">
          Join developers who keep their machines clean and focused.
        </p>

        {/* Auto-detected primary download, then the other platforms */}
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mx-auto">
          <DownloadButton size="lg" />
          {others.map((p) => {
            const Icon = PLATFORM_ICON[p];
            return (
              <a
                key={p}
                href={downloadHref(p)}
                className="flex items-center gap-2.5 px-6 py-4 rounded-xl text-base font-semibold text-white bg-panel/85 hover:bg-panel-2 border border-white/15 hover:border-white/30 backdrop-blur-md transition-all cursor-pointer"
              >
                <Icon className="w-5 h-5 text-white" />
                <span>{p}</span>
              </a>
            );
          })}
        </div>
        <ReleaseNote className="mt-6 max-w-xl mx-auto" />
      </div>
    </section>
  );
};
