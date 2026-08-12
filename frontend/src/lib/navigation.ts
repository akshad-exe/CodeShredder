import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Trash2,
  FolderX,
  Copy,
  Film,
  HardDrive,
  PieChart,
  Terminal,
  Settings,
} from 'lucide-react'

export type PageId =
  | 'overview'
  | 'shred'
  | 'caches'
  | 'duplicates'
  | 'videos'
  | 'large-files'
  | 'treemap'
  | 'wsl'
  | 'settings'

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  { items: [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }] },
  {
    label: 'Reclaim',
    items: [
      { id: 'shred', label: 'Shred', icon: Trash2 },
      { id: 'caches', label: 'Caches', icon: FolderX },
      { id: 'duplicates', label: 'Duplicates', icon: Copy },
    ],
  },
  {
    label: 'Discover',
    items: [
      { id: 'videos', label: 'Videos', icon: Film },
      { id: 'large-files', label: 'Large Files', icon: HardDrive },
      { id: 'treemap', label: 'Treemap', icon: PieChart },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'wsl', label: 'WSL', icon: Terminal },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]