import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-gradient" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="relative container max-w-screen-xl mx-auto px-4 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-1.5 text-sm text-blue-700 dark:text-blue-300 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span>Open Source &middot; Free Forever</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in">
            Reclaim Your
            <br />
            <span className="gradient-text">Disk Space</span>
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground animate-fade-in">
            CodeShredder finds and safely removes developer junk —{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">node_modules</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">.next</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">target</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded textsm">.venv</code>{" "}
            — and reclaims gigabytes in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
            <Link to="/download">
              <Button size="lg" className="text-base px-8 group">
                Download Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a
              href="https://github.com/akshad-exe/CodeShredder"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="text-base px-8">
                View on GitHub
              </Button>
            </a>
          </div>

          <div className="pt-8 animate-fade-in">
            <div className="glass-card rounded-2xl p-1 shadow-2xl max-w-3xl w-full">
              <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm text-left overflow-hidden">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <span className="text-green-400">$</span> codeshredder scan ~/projects
                  </p>
                  <p className="text-blue-400">Scanning 12 directories...</p>
                  <p className="text-yellow-400">
                    Found <span className="text-white font-bold">4.7 GB</span> reclaimable space
                  </p>
                  <p>
                    <span className="text-green-400">✓</span> node_modules <span className="text-gray-500">(38 folders)</span>
                  </p>
                  <p>
                    <span className="text-green-400">✓</span> .next/cache <span className="text-gray-500">(2.1 GB)</span>
                  </p>
                  <p>
                    <span className="text-green-400">✓</span> target/release <span className="text-gray-500">(1.8 GB)</span>
                  </p>
                  <p className="text-green-400 font-bold pt-2">
                    Freed 4.7 GB safely
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
