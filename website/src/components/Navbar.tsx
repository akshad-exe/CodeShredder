import React, { useState } from 'react';
import { CodeShredderWordmark } from './CodeShredderWordmark';
import { WindowsIcon, GitHubIcon } from './BrandIcons';
import { siteConfig } from '../config/site';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onDownloadClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onDownloadClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080A0B]/90 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
        {/* Left: Brand Lockup */}
        <a
          href="#"
          className="flex items-center gap-3 transition-opacity hover:opacity-90 shrink-0"
          aria-label="CodeShredder Home"
        >
          <CodeShredderWordmark iconSize={36} textSize="text-xl sm:text-2xl font-black" />
        </a>

        {/* Center: Desktop Navigation Links (Docs removed per request) */}
        <nav className="hidden md:flex items-center gap-9 text-[15px] font-medium text-[#A7ADB4]">
          <a
            href="#features"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Features
          </a>
          <a
            href="#screenshots"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Screenshots
          </a>
          <a
            href="#download"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Download
          </a>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            GitHub
          </a>
        </nav>

        {/* Right: Primary Download CTA Only (X & Discord removed per request) */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <button
            onClick={onDownloadClick}
            className="flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] active:scale-[0.98] rounded-lg transition-all duration-150 shadow-[0_0_22px_rgba(255,112,43,0.38)] whitespace-nowrap cursor-pointer"
          >
            <WindowsIcon className="w-4 h-4" />
            <span>Download for Windows</span>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={onDownloadClick}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#080A0B] bg-[#FF702B] rounded-lg"
          >
            <WindowsIcon className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#A7ADB4] hover:text-white p-2 focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0D1114] px-5 pt-4 pb-6 space-y-4">
          <div className="flex flex-col space-y-3 text-base font-medium text-[#A7ADB4]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Features
            </a>
            <a
              href="#screenshots"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Screenshots
            </a>
            <a
              href="#download"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Download
            </a>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              GitHub
            </a>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A7ADB4] hover:text-white flex items-center gap-2 text-sm"
            >
              <GitHubIcon className="w-4.5 h-4.5" />
              <span>GitHub Repo</span>
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onDownloadClick();
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#080A0B] bg-[#FF702B] rounded-lg"
            >
              <WindowsIcon className="w-3.5 h-3.5" />
              <span>Download for Windows</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
