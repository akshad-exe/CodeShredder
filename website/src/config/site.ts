const REPO = 'akshad-exe/CodeShredder';
const RELEASE_TAG = 'v0.1.0-beta.1';
const RELEASE_DOWNLOAD = `https://github.com/${REPO}/releases/download/${RELEASE_TAG}`;

export interface DownloadAsset {
  label: string;
  filename: string;
  size: string;
  url: string;
}

export interface PlatformDownload {
  platform: 'Windows' | 'macOS' | 'Linux';
  requirements: string;
  assets: DownloadAsset[];
}

export const siteConfig = {
  name: 'CodeShredder',
  version: RELEASE_TAG,
  tagline: 'Less Junk. More Building.',
  subTagline: 'Find junk fast. Explain what it is. Delete safely.',
  description:
    'CodeShredder is a fast, safe desktop cleanup app for developers and power users. It finds laptop junk, code junk, dependency folders, build artifacts, caches, and WSL bloat — and helps you remove them safely through a beautiful desktop app.',
  githubUrl: `https://github.com/${REPO}`,
  releasesUrl: `https://github.com/${REPO}/releases`,
  issuesUrl: `https://github.com/${REPO}/issues`,
  discussionsUrl: `https://github.com/${REPO}/discussions`,
  docsUrl: `https://github.com/${REPO}#readme`,
  licenseUrl: `https://github.com/${REPO}/blob/main/LICENSE`,
  roadmapUrl: `https://github.com/${REPO}/milestones`,
  rustOfficialUrl: 'https://www.rust-lang.org',
  downloads: {
    windows: {
      platform: 'Windows',
      requirements: 'Windows 10 / 11 (64-bit)',
      assets: [
        {
          label: '.msi',
          filename: 'CodeShredder_0.1.0_x64_en-US.msi',
          size: '5.0 MB',
          url: `${RELEASE_DOWNLOAD}/CodeShredder_0.1.0_x64_en-US.msi`,
        },
        {
          label: '.exe',
          filename: 'CodeShredder_0.1.0_x64-setup.exe',
          size: '3.4 MB',
          url: `${RELEASE_DOWNLOAD}/CodeShredder_0.1.0_x64-setup.exe`,
        },
      ],
    },
    macos: {
      platform: 'macOS',
      requirements: 'macOS 12.0+ (Apple Silicon & Intel)',
      assets: [
        {
          label: '.dmg',
          filename: 'CodeShredder_0.1.0_universal.dmg',
          size: '9.8 MB',
          url: `${RELEASE_DOWNLOAD}/CodeShredder_0.1.0_universal.dmg`,
        },
        {
          label: '.app.tar.gz',
          filename: 'CodeShredder_0.1.0_universal.app.tar.gz',
          size: '9.7 MB',
          url: `${RELEASE_DOWNLOAD}/CodeShredder_0.1.0_universal.app.tar.gz`,
        },
      ],
    },
    linux: {
      platform: 'Linux',
      requirements: 'GLIBC 2.31+ / Ubuntu 20.04+, Fedora 36+, Arch',
      assets: [
        {
          label: 'AppImage',
          filename: 'CodeShredder_0.1.0_amd64.AppImage',
          size: '79.8 MB',
          url: `${RELEASE_DOWNLOAD}/CodeShredder_0.1.0_amd64.AppImage`,
        },
        {
          label: '.deb',
          filename: 'CodeShredder_0.1.0_amd64.deb',
          size: '6.2 MB',
          url: `${RELEASE_DOWNLOAD}/CodeShredder_0.1.0_amd64.deb`,
        },
        {
          label: '.rpm',
          filename: 'CodeShredder-0.1.0-1.x86_64.rpm',
          size: '6.2 MB',
          url: `${RELEASE_DOWNLOAD}/CodeShredder-0.1.0-1.x86_64.rpm`,
        },
      ],
    },
  } satisfies Record<string, PlatformDownload>,
};

export type SiteConfig = typeof siteConfig;

export function platformDownload(
  platform: 'Windows' | 'macOS' | 'Linux',
): PlatformDownload {
  const key = platform === 'Windows' ? 'windows' : platform === 'macOS' ? 'macos' : 'linux';
  return siteConfig.downloads[key];
}