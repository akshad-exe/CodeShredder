import React, { useState } from 'react';
import { RustIcon } from './BrandIcons';
import { Lock, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { siteConfig } from '../config/site';

export const RustAndPrivacy: React.FC = () => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  return (
    <section className="py-12 md:py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Powered by Rust */}
          <div className="group rounded-2xl bg-[#11171B] border border-white/[0.08] hover:border-[#FF702B]/40 p-6 sm:p-8 flex items-start gap-6 transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#FF702B]/15 border border-[#FF702B]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <RustIcon className="w-8 h-8 text-[#FF702B]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Powered by Rust
              </h3>
              <p className="text-sm text-[#A7ADB4] leading-relaxed mb-4">
                Blazing fast. Memory safe. Built for performance and reliability.
              </p>
              <a
                href={siteConfig.rustOfficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF702B] hover:text-[#FF8A24] transition-colors"
              >
                <span>Why Rust?</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Your Data Stays Yours */}
          <div className="group rounded-2xl bg-[#11171B] border border-white/[0.08] hover:border-[#FF702B]/40 p-6 sm:p-8 flex items-start gap-6 transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#FF702B]/15 border border-[#FF702B]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Lock className="w-7 h-7 text-[#FF702B]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Your Data Stays Yours
              </h3>
              <p className="text-sm text-[#A7ADB4] leading-relaxed mb-4">
                100% local. No telemetry. No data leaves your machine.
              </p>
              <button
                onClick={() => setPrivacyModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF702B] hover:text-[#FF8A24] transition-colors cursor-pointer"
              >
                <span>Privacy first</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Modal */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11171B] border border-white/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setPrivacyModalOpen(false)}
              className="absolute top-4 right-4 text-[#A7ADB4] hover:text-white"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-[#FF702B]/20 border border-[#FF702B]/30 flex items-center justify-center mb-5 text-[#FF702B]">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-3">
              CodeShredder Privacy Guarantee
            </h3>

            <div className="space-y-3 text-sm text-[#A7ADB4] leading-relaxed mb-6">
              <p>
                CodeShredder runs as a purely local native desktop executable compiled with Rust and Tauri.
              </p>
              <ul className="space-y-2 list-disc list-inside text-white/90">
                <li><span className="font-semibold text-white">Zero Telemetry:</span> No background pings, analytics trackers, or usage reporting.</li>
                <li><span className="font-semibold text-white">Zero Cloud Sync:</span> All file scan caches and index databases reside strictly on your local SSD/HDD.</li>
                <li><span className="font-semibold text-white">Full Transparency:</span> Every line of source code is open source and auditable on GitHub.</li>
                <li><span className="font-semibold text-white">Safety Net:</span> Deletions move files to your OS Trash by default, ensuring you can restore anything if needed.</li>
              </ul>
            </div>

            <button
              onClick={() => setPrivacyModalOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-[#080A0B] bg-[#FF702B] hover:bg-[#FF8A24] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
