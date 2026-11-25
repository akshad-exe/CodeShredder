import { useScanEvents } from '@/hooks/useScan'
import { useEffect, useState } from 'react'
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
import { About } from '@/pages/About'
import { toast } from '@/components/ui/sonner'
import { checkForUpdate } from '@/lib/updater'

function App() {
  const [page, setPage] = useState<PageId>('overview')

  useScanEvents()

  // Quiet startup check: only speak up when an update exists.
  useEffect(() => {
    checkForUpdate()
      .then((u) => {
        if (u) {
          toast(`CodeShredder ${u.version} is available`, {
            description: 'Open About to install it.',
            action: { label: 'Open About', onClick: () => setPage('about') },
            duration: 10000,
          })
        }
      })
      .catch(() => {})
  }, [])

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
      {page === 'about' && <About />}
    </AppShell>
  )
}

export default App