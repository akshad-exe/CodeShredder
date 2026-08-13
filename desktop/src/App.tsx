import { useState } from 'react'
import { AppShell } from '@/layouts/AppShell'
import type { PageId } from '@/lib/navigation'
import { Overview } from '@/pages/Overview'
import { Shred } from '@/pages/Shred'
import { RecycleBin } from '@/pages/RecycleBin'
import { Caches } from '@/pages/Caches'
import { Wsl } from '@/pages/Wsl'
import { LargeFiles } from '@/pages/LargeFiles'
import { Settings } from '@/pages/Settings'
import { Placeholder } from '@/pages/Placeholder'

function App() {
  const [page, setPage] = useState<PageId>('overview')

  return (
    <AppShell activePage={page} onNavigate={setPage}>
      {page === 'overview' && <Overview onNavigate={setPage} />}
      {page === 'shred' && <Shred />}
      {page === 'recycle-bin' && <RecycleBin />}
      {page === 'caches' && <Caches />}
      {page === 'duplicates' && (
        <Placeholder
          title="Duplicates"
          description="Find and remove identical files across your drives."
        />
      )}
      {page === 'videos' && (
        <Placeholder
          title="Videos"
          description="Spot large video files eating your disk."
        />
      )}
      {page === 'treemap' && (
        <Placeholder
          title="Treemap"
          description="Visualize disk usage by folder size."
        />
      )}
      {page === 'large-files' && <LargeFiles />}
      {page === 'wsl' && <Wsl />}
      {page === 'settings' && <Settings />}
    </AppShell>
  )
}

export default App