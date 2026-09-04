import { useState, useEffect } from "react";
import {
  Download,
  Monitor,
  Apple,
  Terminal,
  FileCode,
  Archive,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type OS = "windows" | "macos" | "linux";

interface Asset {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  primary?: boolean;
}

const RELEASE_BASE =
  "https://github.com/akshad-exe/CodeShredder/releases/download/v0.1.0-beta.1";

const assets: Record<OS, Asset[]> = {
  windows: [
    {
      name: "Windows Installer (.msi)",
      url: `${RELEASE_BASE}/CodeShredder_0.1.0_x64_en-US.msi`,
      icon: Monitor,
      description: "Standard Windows installer. Double-click to install.",
      primary: true,
    },
    {
      name: "Windows Executable (.exe)",
      url: `${RELEASE_BASE}/CodeShredder_0.1.0_x64-setup.exe`,
      icon: FileCode,
      description: "Portable setup executable.",
    },
  ],
  macos: [
    {
      name: "macOS Disk Image (.dmg)",
      url: `${RELEASE_BASE}/CodeShredder_0.1.0_universal.dmg`,
      icon: Apple,
      description: "Universal binary — works on Intel and Apple Silicon.",
      primary: true,
    },
    {
      name: "macOS Archive (.tar.gz)",
      url: `${RELEASE_BASE}/CodeShredder_0.1.0_universal.app.tar.gz`,
      icon: Archive,
      description: "Pre-built app archive. Extract and drag to Applications.",
    },
  ],
  linux: [
    {
      name: "Debian / Ubuntu (.deb)",
      url: `${RELEASE_BASE}/CodeShredder_0.1.0_amd64.deb`,
      icon: Terminal,
      description: "For Ubuntu, Debian, Linux Mint, Pop!_OS.",
      primary: true,
    },
    {
      name: "AppImage (Universal)",
      url: `${RELEASE_BASE}/CodeShredder_0.1.0_amd64.AppImage`,
      icon: Archive,
      description: "Runs on any Linux distro. No installation needed.",
    },
    {
      name: "Fedora / RHEL (.rpm)",
      url: `${RELEASE_BASE}/CodeShredder-0.1.0-1.x86_64.rpm`,
      icon: Terminal,
      description: "For Fedora, RHEL, CentOS, openSUSE.",
    },
  ],
};

const osIcons: Record<OS, React.ComponentType<{ className?: string }>> = {
  windows: Monitor,
  macos: Apple,
  linux: Terminal,
};

const osLabels: Record<OS, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  return "linux";
}

export function DownloadPage() {
  const [selectedOS, setSelectedOS] = useState<OS>("windows");
  const [latestTag, setLatestTag] = useState("v0.1.0-beta.1");

  useEffect(() => {
    setSelectedOS(detectOS());
    fetch("https://api.github.com/repos/akshad-exe/CodeShredder/releases/latest")
      .then((r) => r.json())
      .then((data) => {
        if (data.tag_name) setLatestTag(data.tag_name);
      })
      .catch(() => {});
  }, []);

  const currentAssets = assets[selectedOS];

  return (
    <div className="py-16 md:py-24">
      <div className="container max-w-screen-xl mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="text-sm">
            {latestTag}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Download <span className="gradient-text">CodeShredder</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Free and open source. Available for Windows, macOS, and Linux.
          </p>
        </div>

        {/* OS Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-muted rounded-xl p-1.5">
            {(Object.keys(osLabels) as OS[]).map((os) => {
              const Icon = osIcons[os];
              return (
                <button
                  key={os}
                  onClick={() => setSelectedOS(os)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                    selectedOS === os
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{osLabels[os]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Download Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {currentAssets.map((asset) => {
            const Icon = asset.icon;
            return (
              <Card
                key={asset.name}
                className={`group hover:shadow-lg transition-all duration-300 ${
                  asset.primary
                    ? "border-blue-200 dark:border-blue-800 ring-2 ring-blue-100 dark:ring-blue-900"
                    : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          asset.primary
                            ? "bg-blue-100 dark:bg-blue-900/50"
                            : "bg-muted"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            asset.primary
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                        {asset.primary && (
                          <Badge className="mt-1" variant="default">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {asset.description}
                  </CardDescription>
                  <a href={asset.url} download>
                    <Button
                      variant={asset.primary ? "default" : "outline"}
                      className="w-full group/btn"
                    >
                      <Download className="h-4 w-4 group-hover/btn:animate-bounce" />
                      <span>Download</span>
                    </Button>
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="my-12" />

        {/* All Releases Link */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Looking for a different version or platform?
          </p>
          <a
            href="https://github.com/akshad-exe/CodeShredder/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="group">
              <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              View All Releases on GitHub
            </Button>
          </a>
        </div>

        {/* Checksums Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">Verify Your Download</CardTitle>
              </div>
              <CardDescription>
                Each release includes SHA-256 checksums to verify file integrity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  {
                    name: "checksums-windows.sha256",
                    url: `${RELEASE_BASE}/checksums-windows.sha256`,
                  },
                  {
                    name: "checksums-macos.sha256",
                    url: `${RELEASE_BASE}/checksums-macos.sha256`,
                  },
                  {
                    name: "checksums-linux.sha256",
                    url: `${RELEASE_BASE}/checksums-linux.sha256`,
                  },
                ].map((cs) => (
                  <a
                    key={cs.name}
                    href={cs.url}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <code className="text-muted-foreground">{cs.name}</code>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
