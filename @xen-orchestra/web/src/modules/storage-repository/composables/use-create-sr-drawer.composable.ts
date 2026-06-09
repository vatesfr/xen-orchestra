import { useDrawer } from '@core/packages/drawer/use-drawer.ts'

export function useCreateSrDrawer() {
  const openCreateSrDrawer = useDrawer({
    component: import('@/modules/storage-repository/components/drawer/StorageRepositoryCreateDrawer.vue'),
  })

  return { openCreateSrDrawer }
}
