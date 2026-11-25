import React, { useState } from 'react';
import { CodeShredderWordmark } from './CodeShredderWordmark';
import { GitHubIcon } from './BrandIcons';
import { DownloadButton } from './DownloadButton';
import { siteConfig } from '../config/site';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Left: Brand Lockup */}
        <a
          href="./"
          className="flex items-center gap-3 transition-opacity hover:opacity-90 shrink-0"
          aria-label="CodeShredder Home"
        >
          <CodeShredderWordmark iconSize={36} textSize="text-xl sm:text-2xl font-black" />
        </a>

        {/* Center: Desktop Navigation Links (Docs removed per request) */}
        <nav className="hidden lg:flex items-center gap-9 text-[15px] font-medium text-muted">
          <a
            href="./#features"
            className="py-2 hover:text-white transition-colors whitespace-nowrap"
          >
            Features
          </a>
          <a
            href="./#screenshots"
            className="py-2 hover:text-white transition-colors whitespace-nowrap"
          >
            Screenshots
          </a>
          <a
            href="./download.html"
            className="py-2 hover:text-white transition-colors whitespace-nowrap"
          >
            Download
          </a>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 hover:text-white transition-colors whitespace-nowrap"
          >
            GitHub
          </a>
        </nav>

        {/* Right: Primary Download CTA Only (X & Discord removed per request) */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <DownloadButton size="sm" />
        </div>

        {/* Mobile menu toggle */}
        <div className="flex lg:hidden items-center gap-3">
          <DownloadButton size="sm" compact className="max-[419px]:hidden" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted hover:text-white p-2 focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/[0.08] bg-sidebar px-5 pt-4 pb-6 space-y-4">
          <div className="flex flex-col space-y-3 text-base font-medium text-muted">
            <a
              href="./#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-white"
            >
              Features
            </a>
            <a
              href="./#screenshots"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-white"
            >
              Screenshots
            </a>
            <a
              href="./download.html"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-white"
            >
              Download
            </a>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-white"
            >
              GitHub
            </a>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-white flex items-center gap-2 text-sm"
            >
              <GitHubIcon className="w-4.5 h-4.5" />
              <span>GitHub Repo</span>
            </a>

            <DownloadButton size="sm" />
          </div>
        </div>
      )}
    </header>
  );
};
