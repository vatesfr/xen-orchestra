import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'

export type CreateSrDrawerContext = {
  poolId: FrontXoPool['id']
  hostId?: FrontXoHost['id']
}

export function useCreateSrDrawer() {
  const openCreateSrDrawer = useDrawer((context: CreateSrDrawerContext) => ({
    component: import('@/modules/storage-repository/components/drawer/StorageRepositoryCreateDrawer.vue'),
    props: context,
  }))

  return { openCreateSrDrawer }
}
