import React, { useState } from 'react';
import { Check, Copy, Monitor } from 'lucide-react';
import { isMobileDevice } from '../lib/platform';
import { siteConfig } from '../config/site';

/** Shown on phones and tablets only: the app cannot be installed there. */
export const DesktopOnlyNotice: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [mobile] = useState(isMobileDevice);
  const [copied, setCopied] = useState(false);
  if (!mobile) return null;

  const copy = () =>
    navigator.clipboard
      ?.writeText(siteConfig.downloadPageUrl)
      .then(() => setCopied(true))
      .catch(() => {});

  return (
    <div role="note" className={`w-full rounded-xl border border-accent/40 bg-accent/10 p-4 text-left ${className}`}>
      <p className="flex items-center gap-2 text-sm font-bold text-white">
        <Monitor className="w-4 h-4 shrink-0 text-accent" />
        CodeShredder is a desktop app
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        It runs on Windows, macOS and Linux, not on phones or tablets. Open this site on your computer to install it.
      </p>
      <button
        type="button"
        onClick={copy}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-panel px-3 py-2 text-xs font-semibold text-white cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-safe" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Link copied' : 'Copy download link'}
      </button>
    </div>
  );
};
