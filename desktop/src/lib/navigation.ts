import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Trash2,
  FolderX,
  Recycle,
  Copy,
  Film,
  HardDrive,
  Terminal,
  Settings,
} from 'lucide-react'

export type PageId =
  | 'overview'
  | 'shred'
  | 'recycle-bin'
  | 'caches'
  | 'duplicates'
  | 'videos'
  | 'large-files'
  | 'wsl'
  | 'settings'

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
  /** Tailwind classes tinting the icon chip, e.g. `bg-sky-500/10 text-sky-400`. */
  tone: string
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        tone: 'bg-accent/10 text-accent',
      },
    ],
  },
  {
    label: 'Reclaim',
    items: [
      {
        id: 'shred',
        label: 'Shred',
        icon: Trash2,
        tone: 'bg-rose-500/10 text-rose-400',
      },
      {
        id: 'recycle-bin',
        label: 'Recycle Bin',
        icon: Recycle,
        tone: 'bg-emerald-500/10 text-emerald-400',
      },
      {
        id: 'caches',
        label: 'Caches',
        icon: FolderX,
        tone: 'bg-amber-500/10 text-amber-400',
      },
      {
        id: 'duplicates',
        label: 'Duplicates',
        icon: Copy,
        tone: 'bg-violet-500/10 text-violet-400',
      },
    ],
  },
  {
    label: 'Discover',
    items: [
      {
        id: 'videos',
        label: 'Videos',
        icon: Film,
        tone: 'bg-pink-500/10 text-pink-400',
      },
      {
        id: 'large-files',
        label: 'Large Files',
        icon: HardDrive,
        tone: 'bg-cyan-500/10 text-cyan-400',
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        id: 'wsl',
        label: 'WSL',
        icon: Terminal,
        tone: 'bg-indigo-500/10 text-indigo-400',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        tone: 'bg-slate-500/10 text-slate-300',
      },
    ],
  },
]
