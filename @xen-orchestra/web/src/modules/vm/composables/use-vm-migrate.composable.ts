import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useVmMigrate() {
  const { open: migrateVm } = useOverlay({
    component: () => import('@/modules/vm/components/drawer/VmMigrateDrawer.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  return {
    migrateVm,
  }
}
