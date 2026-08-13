import type {
  CacheEntry,
  DuplicateGroup,
  LargeFileEntry,
  TreemapNode,
  VideoEntry,
} from '@/types/cleanup'

/** Sample datasets for the browser preview — the real data comes from the
 *  v1.0 "Discover" backend commands once they ship. */

export const SAMPLE_CACHES: CacheEntry[] = [
  {
    id: 'cache-npm',
    name: 'npm cache',
    path: 'C:\\Users\\me\\AppData\\Local\\npm-cache',
    sizeBytes: 1_420_000_000,
    category: 'Package managers',
    safety: 'safe',
  },
  {
    id: 'cache-pip',
    name: 'pip cache',
    path: 'C:\\Users\\me\\AppData\\Local\\pip\\cache',
    sizeBytes: 860_000_000,
    category: 'Package managers',
    safety: 'safe',
  },
  {
    id: 'cache-cargo',
    name: 'cargo registry',
    path: 'C:\\Users\\me\\.cargo\\registry',
    sizeBytes: 540_000_000,
    category: 'Package managers',
    safety: 'medium',
  },
  {
    id: 'cache-nuget',
    name: 'NuGet packages',
    path: 'C:\\Users\\me\\.nuget\\packages',
    sizeBytes: 1_150_000_000,
    category: 'Package managers',
    safety: 'medium',
  },
  {
    id: 'cache-edge',
    name: 'Edge cache',
    path: 'C:\\Users\\me\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache',
    sizeBytes: 310_000_000,
    category: 'Browsers',
    safety: 'safe',
  },
  {
    id: 'cache-chrome',
    name: 'Chrome cache',
    path: 'C:\\Users\\me\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache',
    sizeBytes: 480_000_000,
    category: 'Browsers',
    safety: 'safe',
  },
  {
    id: 'cache-msi',
    name: 'Windows installer cache',
    path: 'C:\\Windows\\Installer',
    sizeBytes: 1_900_000_000,
    category: 'System',
    safety: 'dangerous',
  },
  {
    id: 'cache-yarn',
    name: 'yarn cache',
    path: 'C:\\Users\\me\\AppData\\Local\\Yarn\\Cache',
    sizeBytes: 230_000_000,
    category: 'Package managers',
    safety: 'safe',
  },
]

export const SAMPLE_LARGE_FILES: LargeFileEntry[] = [
  {
    id: 'lf-1',
    path: 'D:\\media\\movies\\int.2023.remux.mkv',
    name: 'int.2023.remux.mkv',
    sizeBytes: 41_300_000_000,
    modifiedAt: '2024-11-02T20:15:00Z',
    ext: 'mkv',
  },
  {
    id: 'lf-2',
    path: 'D:\\backups\\photos-2023.zip',
    name: 'photos-2023.zip',
    sizeBytes: 18_700_000_000,
    modifiedAt: '2024-12-19T08:04:00Z',
    ext: 'zip',
  },
  {
    id: 'lf-3',
    path: 'C:\\Users\\me\\Downloads\\ubuntu-24.04-desktop-amd64.iso',
    name: 'ubuntu-24.04-desktop-amd64.iso',
    sizeBytes: 5_700_000_000,
    modifiedAt: '2025-02-01T14:30:00Z',
    ext: 'iso',
  },
  {
    id: 'lf-4',
    path: 'C:\\Users\\me\\AppData\\Local\\Temp\\huge-installer.exe',
    name: 'huge-installer.exe',
    sizeBytes: 2_300_000_000,
    modifiedAt: '2025-01-22T09:12:00Z',
    ext: 'exe',
  },
  {
    id: 'lf-5',
    path: 'D:\\projects\\legacy\\vm-disk.vhdx',
    name: 'vm-disk.vhdx',
    sizeBytes: 64_000_000_000,
    modifiedAt: '2024-08-30T11:45:00Z',
    ext: 'vhdx',
  },
  {
    id: 'lf-6',
    path: 'C:\\Users\\me\\Documents\\scans\\archive-2019.pdf',
    name: 'archive-2019.pdf',
    sizeBytes: 890_000_000,
    modifiedAt: '2025-03-10T17:00:00Z',
    ext: 'pdf',
  },
]

export const SAMPLE_DUPLICATES: DuplicateGroup[] = [
  {
    id: 'dup-1',
    sizeBytes: 124_000_000,
    files: [
      {
        id: 'dup-1-a',
        path: 'C:\\Users\\me\\Desktop\\vacation.mp4',
        name: 'vacation.mp4',
        modifiedAt: '2024-06-15T10:00:00Z',
      },
      {
        id: 'dup-1-b',
        path: 'D:\\media\\clips\\vacation-copy.mp4',
        name: 'vacation-copy.mp4',
        modifiedAt: '2024-06-15T10:00:00Z',
      },
    ],
  },
  {
    id: 'dup-2',
    sizeBytes: 42_000_000,
    files: [
      {
        id: 'dup-2-a',
        path: 'C:\\Users\\me\\Documents\\resume-final.docx',
        name: 'resume-final.docx',
        modifiedAt: '2025-01-05T09:00:00Z',
      },
      {
        id: 'dup-2-b',
        path: 'C:\\Users\\me\\Desktop\\resume-final-copy.docx',
        name: 'resume-final-copy.docx',
        modifiedAt: '2025-01-05T09:00:00Z',
      },
      {
        id: 'dup-2-c',
        path: 'D:\\backups\\resume-final-backup.docx',
        name: 'resume-final-backup.docx',
        modifiedAt: '2025-01-05T09:00:00Z',
      },
    ],
  },
  {
    id: 'dup-3',
    sizeBytes: 7_200_000_000,
    files: [
      {
        id: 'dup-3-a',
        path: 'D:\\downloads\\photos-2024.zip',
        name: 'photos-2024.zip',
        modifiedAt: '2024-12-01T12:00:00Z',
      },
      {
        id: 'dup-3-b',
        path: 'D:\\backups\\photos-2024 (1).zip',
        name: 'photos-2024 (1).zip',
        modifiedAt: '2024-12-01T12:00:00Z',
      },
    ],
  },
]

export const SAMPLE_VIDEOS: VideoEntry[] = [
  {
    id: 'vid-1',
    path: 'D:\\media\\movies\\int.2023.remux.mkv',
    name: 'int.2023.remux.mkv',
    sizeBytes: 41_300_000_000,
    ext: 'mkv',
    durationSec: 8260,
  },
  {
    id: 'vid-2',
    path: 'D:\\media\\tv\\series.s01e04.1080p.mkv',
    name: 'series.s01e04.1080p.mkv',
    sizeBytes: 3_900_000_000,
    ext: 'mkv',
    durationSec: 2700,
  },
  {
    id: 'vid-3',
    path: 'C:\\Users\\me\\Videos\\demo-recording.mp4',
    name: 'demo-recording.mp4',
    sizeBytes: 1_400_000_000,
    ext: 'mp4',
    durationSec: 1830,
  },
  {
    id: 'vid-4',
    path: 'D:\\media\\clips\\birthday-party.mp4',
    name: 'birthday-party.mp4',
    sizeBytes: 620_000_000,
    ext: 'mp4',
    durationSec: 415,
  },
  {
    id: 'vid-5',
    path: 'D:\\media\\tv\\series.s01e01.1080p.mkv',
    name: 'series.s01e01.1080p.mkv',
    sizeBytes: 3_700_000_000,
    ext: 'mkv',
    durationSec: 2650,
  },
]

export const SAMPLE_TREEMAP: TreemapNode = {
  path: 'D:\\',
  name: 'D:',
  sizeBytes: 412_000_000_000,
  fileCount: 88_000,
  children: [
    {
      path: 'D:\\media',
      name: 'media',
      sizeBytes: 214_000_000_000,
      fileCount: 41_000,
      children: [
        {
          path: 'D:\\media\\movies',
          name: 'movies',
          sizeBytes: 121_000_000_000,
          fileCount: 240,
          children: [
            { path: 'D:\\media\\movies\\int.2023.remux.mkv', name: 'int.2023.remux.mkv', sizeBytes: 41_300_000_000, fileCount: 1 },
            { path: 'D:\\media\\movies\\other.mkv', name: 'other.mkv', sizeBytes: 12_000_000_000, fileCount: 1 },
          ],
        },
        {
          path: 'D:\\media\\tv',
          name: 'tv',
          sizeBytes: 68_000_000_000,
          fileCount: 1_900,
        },
        {
          path: 'D:\\media\\music',
          name: 'music',
          sizeBytes: 25_000_000_000,
          fileCount: 38_800,
        },
      ],
    },
    {
      path: 'D:\\backups',
      name: 'backups',
      sizeBytes: 98_000_000_000,
      fileCount: 5_400,
      children: [
        { path: 'D:\\backups\\photos-2023.zip', name: 'photos-2023.zip', sizeBytes: 18_700_000_000, fileCount: 1 },
        { path: 'D:\\backups\\photos-2022.zip', name: 'photos-2022.zip', sizeBytes: 15_900_000_000, fileCount: 1 },
        { path: 'D:\\backups\\system-image', name: 'system-image', sizeBytes: 54_000_000_000, fileCount: 5_300 },
      ],
    },
    {
      path: 'D:\\projects',
      name: 'projects',
      sizeBytes: 76_000_000_000,
      fileCount: 40_000,
      children: [
        { path: 'D:\\projects\\vm-disk.vhdx', name: 'vm-disk.vhdx', sizeBytes: 64_000_000_000, fileCount: 1 },
        { path: 'D:\\projects\\archived', name: 'archived', sizeBytes: 12_000_000_000, fileCount: 39_900 },
      ],
    },
    {
      path: 'D:\\downloads',
      name: 'downloads',
      sizeBytes: 24_000_000_000,
      fileCount: 1_600,
      children: [
        { path: 'D:\\downloads\\ubuntu-24.04-desktop-amd64.iso', name: 'ubuntu-24.04-desktop-amd64.iso', sizeBytes: 5_700_000_000, fileCount: 1 },
        { path: 'D:\\downloads\\others', name: 'others', sizeBytes: 18_300_000_000, fileCount: 1_590 },
      ],
    },
  ],
}
