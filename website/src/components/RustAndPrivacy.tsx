import React, { useRef } from 'react';
import { RustIcon } from './BrandIcons';
import { Lock, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { siteConfig } from '../config/site';

export const RustAndPrivacy: React.FC = () => {
  const privacyDialog = useRef<HTMLDialogElement>(null);

  return (
    <section className="py-12 md:py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Powered by Rust */}
          <div className="group rounded-2xl bg-panel border border-white/[0.08] hover:border-accent/40 p-6 sm:p-8 flex items-start gap-6 transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <RustIcon className="w-8 h-8 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Powered by Rust
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Blazing fast. Memory safe. Built for performance and reliability.
              </p>
              <a
                href={siteConfig.rustOfficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80 transition-colors py-1.5"
              >
                <span>Why Rust?</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Card 2: Your Data Stays Yours */}
          <div id="privacy" className="scroll-mt-28 group rounded-2xl bg-panel border border-white/[0.08] hover:border-accent/40 p-6 sm:p-8 flex items-start gap-6 transition-all duration-200">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Lock className="w-7 h-7 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Your Data Stays Yours
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Scans run on your machine. No telemetry, and your files are never uploaded.
              </p>
              <button
                type="button"
                onClick={() => privacyDialog.current?.showModal()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80 transition-colors cursor-pointer py-1.5"
              >
                <span>Privacy first</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Native dialog: Escape, focus trapping and the dialog role come built in. */}
      <dialog
        ref={privacyDialog}
        aria-labelledby="privacy-title"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-white/15 bg-panel p-0 text-text shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <form method="dialog" className="relative p-6 sm:p-8">
          <button
            className="absolute top-4 right-4 p-1 text-muted hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-5 text-accent">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h3 id="privacy-title" className="text-xl font-bold text-white mb-3">
            How CodeShredder handles your data
          </h3>

          <div className="space-y-3 text-sm text-muted leading-relaxed mb-6">
            <p>CodeShredder is a native desktop app built with Rust and Tauri.</p>
            <ul className="space-y-2 list-disc list-inside text-white/90">
              <li><span className="font-semibold text-white">No telemetry:</span> no analytics, accounts or usage reporting.</li>
              <li><span className="font-semibold text-white">Local scans:</span> file lists and scan caches stay on your disk.</li>
              <li><span className="font-semibold text-white">One network call:</span> the app checks GitHub for updates.</li>
              <li><span className="font-semibold text-white">Open source:</span> every line is auditable on GitHub.</li>
              <li><span className="font-semibold text-white">Trash first:</span> scanned items go to your Trash by default. Cache cleaning is permanent and asks first.</li>
            </ul>
          </div>

          <button className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-black bg-accent hover:bg-accent/80 transition-colors cursor-pointer">
            Got it
          </button>
        </form>
      </dialog>
    </section>
  );
};
