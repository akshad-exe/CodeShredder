import { useState } from 'react';
import { detectPlatform, type Platform } from './lib/platform';
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
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(() => detectPlatform() ?? 'Windows');

  const handleOpenDownload = (platform?: Platform) => {
    setSelectedPlatform(platform ?? selectedPlatform);
    setDownloadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-text selection:bg-accent selection:text-white">
      {/* Navigation */}
      <Navbar />

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
        <DownloadCTA onPlatformClick={handleOpenDownload} />
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
