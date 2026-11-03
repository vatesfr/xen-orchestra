import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

// A monitored policy's report, in a drawer: from its row on the board
export function useVdfMonitorDrawer() {
  const { open } = useOverlay({
    component: () => import('@/modules/vdf/components/monitor/VdfMonitorDrawer.vue'),
    events: { onCancel: true },
  })

  function openMonitorReport(poolId: string, policy: string) {
    return open({ props: { poolId, policy } })
  }

  return { openMonitorReport }
}
