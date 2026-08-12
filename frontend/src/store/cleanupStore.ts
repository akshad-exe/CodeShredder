import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CleanupTarget, AppSettings, ScanResult, SafetyLevel } from '@/types/cleanup'

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
  addTarget: (target: CleanupTarget) => void
  updateTargetSize: (id: string, sizeBytes: number, fileCount: number) => void
  setSelectedTargets: (ids: Set<string>) => void
  toggleTargetSelection: (id: string) => void
  selectAllTargets: (safetyLevel?: SafetyLevel) => void
  deselectAllTargets: () => void
  setTotalReclaimable: (size: number) => void
  setScanError: (error: string | null) => void
  setSettings: (settings: Partial<AppSettings>) => void
  resetScan: () => void
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