import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

// the trace drawer open now, from whichever component: a trace opened from
// inside it (a recent drop's "Why?") replaces it, not one drawer on another
let abortOpen: (() => void) | undefined

// The trace drawer: a pool's trace, prefilled (run: '1' runs it at once),
// opened from a row's "Why?", a VM's page or the Firewall's "Trace a
// connection"
export function useVdfTraceDrawer() {
  const { open, abort } = useOverlay({
    component: () => import('@/modules/vdf/components/trace/VdfTraceDrawer.vue'),
    events: { onCancel: true },
  })

  function openTrace(poolId: string, query: VdfTraceQuery = {}) {
    abortOpen?.()
    abortOpen = abort

    return open({ props: { poolId, query } })
  }

  return { openTrace }
}
