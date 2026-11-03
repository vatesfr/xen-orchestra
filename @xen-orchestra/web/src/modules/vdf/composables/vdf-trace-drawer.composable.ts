import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

// The trace drawer: a pool's trace, prefilled (run: '1' runs it at once),
// opened from a row's "Why?" or a VM's page
export function useVdfTraceDrawer() {
  const { open } = useOverlay({
    component: () => import('@/modules/vdf/components/trace/VdfTraceDrawer.vue'),
    events: { onCancel: true },
  })

  function openTrace(poolId: string, query: VdfTraceQuery = {}) {
    return open({ props: { poolId, query } })
  }

  return { openTrace }
}
