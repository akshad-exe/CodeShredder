import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { JunkCategories } from './components/JunkCategories';
import { FeaturesAndSpace } from './components/FeaturesAndSpace';
import { DesktopAppShowcase } from './components/DesktopAppShowcase';
import { DeveloperEcosystems } from './components/DeveloperEcosystems';
import { RustAndPrivacy } from './components/RustAndPrivacy';
import { DownloadCTA } from './components/DownloadCTA';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-text selection:bg-accent selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <JunkCategories />
        <FeaturesAndSpace />
        <DesktopAppShowcase />
        <DeveloperEcosystems />
        <RustAndPrivacy />
        <DownloadCTA />
      </main>
      <Footer />
    </div>
  );
}
