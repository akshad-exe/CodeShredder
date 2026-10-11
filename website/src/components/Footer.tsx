import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CodeShredderWordmark } from './CodeShredderWordmark';
import { GitHubIcon } from './BrandIcons';
import { siteConfig } from '../config/site';

interface FooterProps {
  onDownloadClick: () => void;
  onPrivacyClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onDownloadClick, onPrivacyClick }) => {
  return (
    <footer className="bg-[#050708] border-t border-white/[0.06] pt-20 pb-14 text-sm text-[#A7ADB4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top 4-column + Catchphrase Area */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 lg:gap-12 pb-16">
          {/* Column 1: Brand & Tagline */}
          <div className="col-span-2 md:col-span-4 flex flex-col items-start">
            <a href="#" className="mb-3 hover:opacity-95 transition-opacity inline-block">
              <CodeShredderWordmark iconSize={40} textSize="text-2xl font-black" />
            </a>
            <p className="text-sm text-[#8A929A] font-medium tracking-wide mt-1">
              Clean. Reclaim. Code More.
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#screenshots" className="hover:text-white transition-colors">
                  Screenshots
                </a>
              </li>
              <li>
                <button
                  onClick={onDownloadClick}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Download
                </button>
              </li>
              <li>
                <a
                  href={siteConfig.releasesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Community */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5">
              Community
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.issuesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.discussionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Discussions
                </a>
              </li>
              <li>
                <a
                  href={`${siteConfig.githubUrl}#contributing`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Contribute
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-5">
              Resources
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={siteConfig.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Docs
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.roadmapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Roadmap
                </a>
              </li>
              <li>
                <button
                  onClick={onPrivacyClick}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy
                </button>
              </li>
              <li>
                <a
                  href={siteConfig.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  License
                </a>
              </li>
            </ul>
          </div>

          {/* Right Brand Phrase: "Less Junk / More Building" */}
          <div className="col-span-1 md:col-span-2 flex items-center justify-end select-none">
            <div className="transform -rotate-6 text-right">
              <span className="font-handwriting text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FFA234] leading-tight block drop-shadow-md">
                Less Junk<br />More Building
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-[#747D85]">
          <div>
            © {new Date().getFullYear()} CodeShredder. Open source. Built with Rust. Made for developers, by developers.
          </div>

          <div className="flex items-center gap-5 text-[#A7ADB4]">
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white hover:scale-110 transition-all p-1"
              aria-label="GitHub"
            >
              <GitHubIcon className="w-5 h-5" />
            </a>
            <a
              href={siteConfig.issuesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white hover:scale-110 transition-all p-1"
              aria-label="Report an issue"
            >
              <AlertCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
