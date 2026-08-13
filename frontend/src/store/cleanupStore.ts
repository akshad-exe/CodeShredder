import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CleanupTarget, AppSettings, SafetyLevel, CleanSummary } from '@/types/cleanup'

interface CleanupState {
  // Scan state
  scanRoots: string[]
  enabledPatterns: string[]
  scanStatus: 'idle' | 'scanning' | 'complete' | 'error'
  scanProgress: number
  currentScanPath: string
  targets: CleanupTarget[]
  selectedTargets: Set<string>
  totalReclaimable: number
  scanError: string | null

  // Cleanup state
  cleanupStatus: 'idle' | 'cleaning' | 'complete' | 'error'
  cleanupSummary: CleanSummary | null
  
  // Settings
  settings: AppSettings
  
  // Actions
  setScanRoots: (roots: string[]) => void
  addScanRoot: (root: string) => void
  removeScanRoot: (root: string) => void
  setEnabledPatterns: (patterns: string[]) => void
  togglePattern: (pattern: string) => void
  setScanStatus: (status: CleanupState['scanStatus']) => void
  setScanProgress: (progress: number) => void
  setCurrentScanPath: (path: string) => void
  setTargets: (targets: CleanupTarget[]) => void
  addLiveTarget: (target: CleanupTarget) => void
  addTarget: (target: CleanupTarget) => void
  updateTargetSize: (id: string, sizeBytes: number, fileCount: number) => void
  setSelectedTargets: (ids: Set<string>) => void
  toggleTargetSelection: (id: string) => void
  selectAllTargets: (safetyLevel?: SafetyLevel) => void
  deselectAllTargets: () => void
  setTotalReclaimable: (size: number) => void
  setScanError: (error: string | null) => void
  setCleanupStatus: (status: CleanupState['cleanupStatus']) => void
  setCleanupSummary: (summary: CleanSummary | null) => void
  removeTrashedTargets: () => void
  removeTargets: (ids: string[]) => void
  setSettings: (settings: Partial<AppSettings>) => void
  resetScan: () => void
  populateDefaultRoots: () => void
}

const defaultSettings: AppSettings = {
  scanRoots: [],
  enabledPatterns: [
    'node_modules',
    '.next',
    '.nuxt',
    'dist',
    'build',
    'target',
    '__pycache__',
    '.pytest_cache',
    '.parcel-cache',
    '.turbo',
  ],
  deleteMode: 'trash',
  confirmDangerous: true,
  confirmMedium: true,
}

export const useCleanupStore = create<CleanupState>()(
  persist(
    (set, get) => ({
      // Initial state
      scanRoots: [],
      enabledPatterns: defaultSettings.enabledPatterns,
      scanStatus: 'idle',
      scanProgress: 0,
      currentScanPath: '',
      targets: [],
      selectedTargets: new Set(),
      totalReclaimable: 0,
      scanError: null,
      cleanupStatus: 'idle',
      cleanupSummary: null,
      settings: defaultSettings,
      
      // Actions
      setScanRoots: (roots) => set({ scanRoots: roots }),
      addScanRoot: (root) => set((state) => ({ 
        scanRoots: [...state.scanRoots, root] 
      })),
      removeScanRoot: (root) => set((state) => ({ 
        scanRoots: state.scanRoots.filter((r) => r !== root) 
      })),
      setEnabledPatterns: (patterns) => set({ enabledPatterns: patterns }),
      togglePattern: (pattern) => set((state) => ({
        enabledPatterns: state.enabledPatterns.includes(pattern)
          ? state.enabledPatterns.filter((p) => p !== pattern)
          : [...state.enabledPatterns, pattern]
      })),
      setScanStatus: (scanStatus) => set({ scanStatus }),
      setScanProgress: (scanProgress) => set({ scanProgress }),
      setCurrentScanPath: (currentScanPath) => set({ currentScanPath }),
      setTargets: (targets) => set({ targets }),
      addLiveTarget: (target) => set((state) => ({
        targets: [...state.targets, target],
        totalReclaimable: state.totalReclaimable + target.sizeBytes,
      })),
      addTarget: (target) => set((state) => ({ 
        targets: [...state.targets, target] 
      })),
      updateTargetSize: (id, sizeBytes, fileCount) => set((state) => ({
        targets: state.targets.map((t) => 
          t.id === id ? { ...t, sizeBytes, fileCount } : t
        )
      })),
      setSelectedTargets: (selectedTargets) => set({ selectedTargets }),
      toggleTargetSelection: (id) => set((state) => {
        const newSelected = new Set(state.selectedTargets)
        if (newSelected.has(id)) {
          newSelected.delete(id)
        } else {
          newSelected.add(id)
        }
        return { selectedTargets: newSelected }
      }),
      selectAllTargets: (safetyLevel) => set((state) => {
        const newSelected = new Set(state.selectedTargets)
        state.targets.forEach((t) => {
          if (!safetyLevel || t.safetyLevel === safetyLevel) {
            newSelected.add(t.id)
          }
        })
        return { selectedTargets: newSelected }
      }),
      deselectAllTargets: () => set({ selectedTargets: new Set() }),
      setTotalReclaimable: (totalReclaimable) => set({ totalReclaimable }),
      setScanError: (scanError) => set({ scanError }),
      setCleanupStatus: (cleanupStatus) => set({ cleanupStatus }),
      setCleanupSummary: (cleanupSummary) => set({ cleanupSummary }),
      removeTrashedTargets: () => set((state) => {
        const trashedIds = new Set(state.selectedTargets)
        const targets = state.targets.filter((t) => !trashedIds.has(t.id))
        const reclaimed = state.targets
          .filter((t) => trashedIds.has(t.id))
          .reduce((acc, t) => acc + t.sizeBytes, 0)
        return {
          targets,
          selectedTargets: new Set(),
          totalReclaimable: Math.max(0, state.totalReclaimable - reclaimed),
        }
      }),
      removeTargets: (ids) => set((state) => {
        const removed = new Set(ids)
        const targets = state.targets.filter((t) => !removed.has(t.id))
        const reclaimed = state.targets
          .filter((t) => removed.has(t.id))
          .reduce((acc, t) => acc + t.sizeBytes, 0)
        const selectedTargets = new Set(
          [...state.selectedTargets].filter((id) => !removed.has(id)),
        )
        return {
          targets,
          selectedTargets,
          totalReclaimable: Math.max(0, state.totalReclaimable - reclaimed),
        }
      }),
      setSettings: (settings) => set((state) => ({ 
        settings: { ...state.settings, ...settings } 
      })),
      resetScan: () => set({
        scanStatus: 'idle',
        scanProgress: 0,
        currentScanPath: '',
        targets: [],
        selectedTargets: new Set(),
        totalReclaimable: 0,
        scanError: null,
      }),
      populateDefaultRoots: () => {
        const roots = getDefaultScanRoots()
        const existing = new Set(get().scanRoots)
        const newRoots = roots.filter((r) => !existing.has(r))
        if (newRoots.length > 0) {
          set((state) => ({ scanRoots: [...state.scanRoots, ...newRoots] }))
        }
      },
    }),
    {
      name: 'codeshredder-settings',
      partialize: (state) => ({ 
        settings: state.settings,
        scanRoots: state.scanRoots,
        enabledPatterns: state.enabledPatterns,
      }),
    }
  )
)

function getDefaultScanRoots(): string[] {
  const home = typeof window !== 'undefined' ? '' : ''
  // We'll use Tauri's path resolver on the backend, but here we provide
  // common patterns that the backend's expand_root will handle
  if (navigator.platform.startsWith('Win')) {
    return [
      '~/Developer',
      '~/Code',
      '~/Projects',
      '~/Repos',
      '~/GitHub',
    ]
  }
  return [
    '~/Developer',
    '~/Code',
    '~/Projects',
    '~/Repos',
    '~/GitHub',
  ]
}