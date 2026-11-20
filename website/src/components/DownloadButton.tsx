import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { AppleIcon, LinuxIcon, WindowsIcon } from './BrandIcons';
import { platformDownload } from '../config/site';
import { detectPlatform, type Platform } from '../lib/platform';

export const PLATFORM_ICON: Record<Platform, React.FC<{ className?: string }>> = {
  Windows: WindowsIcon,
  macOS: AppleIcon,
  Linux: LinuxIcon,
};

/** The visitor's detected OS (null on mobile/unknown). Detected once, on first render. */
export function useDetectedPlatform(): Platform | null {
  const [platform] = useState(detectPlatform);
  return platform;
}

const SIZES = {
  sm: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-7 py-3.5 sm:py-4 text-base rounded-xl gap-3',
} as const;

interface DownloadButtonProps {
  size?: keyof typeof SIZES;
  /** Short label ("Download") for tight spaces such as the mobile header. */
  compact?: boolean;
  className?: string;
}

/**
 * Primary call to action: downloads the installer for the visitor's OS.
 * On phones and unknown systems it scrolls to the full download section.
 */
export const DownloadButton: React.FC<DownloadButtonProps> = ({ size = 'lg', compact, className = '' }) => {
  const platform = useDetectedPlatform();
  const Icon = platform ? PLATFORM_ICON[platform] : Download;
  const asset = platform ? platformDownload(platform).assets[0] : null;
  const label = compact ? 'Download' : platform ? `Download for ${platform}` : 'Download';

  return (
    <a
      href={asset?.url ?? '#download'}
      download={asset ? asset.filename : undefined}
      title={asset ? `${asset.filename} · ${asset.size}` : undefined}
      className={`inline-flex items-center justify-center whitespace-nowrap font-bold text-black bg-accent hover:bg-accent/90 active:scale-[0.98] transition-all duration-150 shadow-[0_0_28px_rgba(255,112,43,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${SIZES[size]} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      <span>{label}</span>
    </a>
  );
};
