import { useState } from 'react'
import { AppShell } from '@/layouts/AppShell'
import type { PageId } from '@/lib/navigation'
import { OverviewPage } from '@/pages/OverviewPage'
import { ShredPage } from '@/pages/ShredPage'
import { RecycleBinPage } from '@/pages/RecycleBinPage'
import { CachesPage } from '@/pages/CachesPage'
import { WslPage } from '@/pages/WslPage'
import { LargeFilesPage } from '@/pages/LargeFilesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

function App() {
  const [page, setPage] = useState<PageId>('overview')

  return (
    <AppShell activePage={page} onNavigate={setPage}>
      {page === 'overview' && <OverviewPage onNavigate={setPage} />}
      {page === 'shred' && <ShredPage />}
      {page === 'recycle-bin' && <RecycleBinPage />}
      {page === 'caches' && <CachesPage />}
      {page === 'duplicates' && (
        <PlaceholderPage
          title="Duplicates"
          description="Find and remove identical files across your drives."
        />
      )}
      {page === 'videos' && (
        <PlaceholderPage
          title="Videos"
          description="Spot large video files eating your disk."
        />
      )}
      {page === 'treemap' && (
        <PlaceholderPage
          title="Treemap"
          description="Visualize disk usage by folder size."
        />
      )}
      {page === 'large-files' && <LargeFilesPage />}
      {page === 'wsl' && <WslPage />}
      {page === 'settings' && <SettingsPage />}
    </AppShell>
  )
}

export default App