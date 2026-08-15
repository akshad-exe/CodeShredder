import { useState } from 'react'
import { AppShell } from '@/layouts/AppShell'
import type { PageId } from '@/lib/navigation'
import { Overview } from '@/pages/Overview'
import { Shred } from '@/pages/Shred'
import { RecycleBin } from '@/pages/RecycleBin'
import { Caches } from '@/pages/Caches'
import { Wsl } from '@/pages/Wsl'
import { LargeFiles } from '@/pages/LargeFiles'
import { Duplicates } from '@/pages/Duplicates'
import { Videos } from '@/pages/Videos'
import { Settings } from '@/pages/Settings'

function App() {
  const [page, setPage] = useState<PageId>('overview')

  return (
    <AppShell activePage={page} onNavigate={setPage}>
      {page === 'overview' && <Overview onNavigate={setPage} />}
      {page === 'shred' && <Shred />}
      {page === 'recycle-bin' && <RecycleBin />}
      {page === 'caches' && <Caches />}
      {page === 'duplicates' && <Duplicates />}
      {page === 'videos' && <Videos />}
      {page === 'large-files' && <LargeFiles />}
      {page === 'wsl' && <Wsl />}
      {page === 'settings' && <Settings />}
    </AppShell>
  )
}

export default App