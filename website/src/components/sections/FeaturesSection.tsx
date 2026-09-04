import {
  FolderSearch,
  Trash2,
  Shield,
  HardDrive,
  Layers,
  Zap,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const features = [
  {
    icon: FolderSearch,
    title: "Smart Scanning",
    description:
      "Detects node_modules, .next, target, dist, build, .venv, __pycache__ and 20+ more patterns across your projects.",
  },
  {
    icon: Trash2,
    title: "Safe Cleanup",
    description:
      "Moves items to Trash first — never permanent delete. Review everything before it's gone for good.",
  },
  {
    icon: Shield,
    title: "Protection Rules",
    description:
      "Built-in safety rules prevent removing critical files. System directories and active projects are protected.",
  },
  {
    icon: HardDrive,
    title: "WSL Optimizer",
    description:
      "Compact WSL virtual disks on Windows. Reclaim hidden GBs from VHD bloat that other tools can't touch.",
  },
  {
    icon: Layers,
    title: "Cache Cleaning",
    description:
      "Clear package manager caches (npm, yarn, pnpm, pip, cargo) and system caches in one click.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description:
      "Parallel scanning powered by Rust + rayon. Scans thousands of folders in seconds, not minutes.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container max-w-screen-xl mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything You Need to{" "}
            <span className="gradient-text">Shred the Junk</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete toolkit for reclaiming disk space from developer
            build artifacts, caches, and virtual machines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className="group hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
