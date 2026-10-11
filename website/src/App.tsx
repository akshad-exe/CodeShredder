import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { JunkCategories } from './components/JunkCategories';
import { FeaturesAndSpace } from './components/FeaturesAndSpace';
import { DesktopAppShowcase } from './components/DesktopAppShowcase';
import { DeveloperEcosystems } from './components/DeveloperEcosystems';
import { RustAndPrivacy } from './components/RustAndPrivacy';
import { DownloadCTA } from './components/DownloadCTA';
import { Footer } from './components/Footer';
import { DownloadModal } from './components/DownloadModal';

export default function App() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'Windows' | 'macOS' | 'Linux'>('Windows');

  React.useEffect(() => {
    const ua = navigator.userAgent;
    if (/Mac OS X|Macintosh/i.test(ua)) setSelectedPlatform('macOS');
    else if (/Linux|X11/i.test(ua)) setSelectedPlatform('Linux');
    else setSelectedPlatform('Windows');
  }, []);

  const handleOpenDownload = (platform?: 'Windows' | 'macOS' | 'Linux') => {
    setSelectedPlatform(platform ?? selectedPlatform);
    setDownloadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#080A0B] text-[#F5F5F5] selection:bg-[#FF702B] selection:text-black">
      {/* Navigation */}
      <Navbar onDownloadClick={() => handleOpenDownload()} />

      <main>
        {/* Section B: Hero */}
        <Hero onDownloadClick={() => handleOpenDownload()} />

        {/* Section C: Developer Junk Categories */}
        <JunkCategories />

        {/* Section D: Features & Reclaimable Space Preview */}
        <FeaturesAndSpace />

        {/* Section E: Desktop Application Showcase */}
        <DesktopAppShowcase />

        {/* Section F: Supported Developer Ecosystems */}
        <DeveloperEcosystems />

        {/* Section G: Rust and Privacy Cards */}
        <RustAndPrivacy />

        {/* Section H: Final Download CTA */}
        <DownloadCTA
          onDownloadClick={() => handleOpenDownload()}
          onPlatformClick={(p) => handleOpenDownload(p as 'Windows' | 'macOS' | 'Linux')}
        />
      </main>

      {/* Section I: Footer */}
      <Footer
        onDownloadClick={() => handleOpenDownload()}
        onPrivacyClick={() => {
          // Smooth scroll to Rust & Privacy or open modal
          const elem = document.getElementById('features');
          elem?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Download Modal Dialog */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        selectedPlatform={selectedPlatform}
      />
    </div>
  );
}
