import React from 'react';
import { siteConfig } from '../config/site';

/** What a visitor should know before running the current download. */
export const ReleaseNote: React.FC<{ className?: string }> = ({ className = '' }) => (
  <p className={`text-xs text-muted leading-relaxed ${className}`}>
    {siteConfig.version.includes('-') &&
      `${siteConfig.version} is a pre-release and missing the latest features and safety fixes. `}
    Builds are not code-signed yet, so Windows SmartScreen and macOS Gatekeeper will warn on first launch.
  </p>
);
