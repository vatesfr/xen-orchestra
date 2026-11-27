import { useXoaProxySetJob } from '@/modules/appliance/jobs/xoa-proxy-set.job.ts'
import { useXoaProxy } from '@/modules/appliance/remote-resources/use-xoa-proxy.ts'
import type { XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useNewProxy() {
  const { reloadProxy } = useXoaProxy()

  const payload = ref<XoaProxyPayload>()

  const { run, isRunning: isAddingProxy } = useXoaProxySetJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/appliance/components/drawer/NewProxyDrawer.vue'),
    events: {
      onConfirm: async (newPayload: XoaProxyPayload) => {
        payload.value = newPayload

        try {
          await run()
        } catch (error) {
          console.error('Error when adding the proxy', error)
          return KEEP_OVERLAY_OPEN
        }

        await reloadProxy()
      },
      onCancel: true,
    },
  })

  function openNewProxyDrawer() {
    return open()
  }

  return {
    openNewProxyDrawer,
    isAddingProxy,
  }
}
