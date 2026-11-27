import { useXoaProxyRemoveJob } from '@/modules/appliance/jobs/xoa-proxy-remove.job.ts'
import { useXoaProxySetJob } from '@/modules/appliance/jobs/xoa-proxy-set.job.ts'
import { useXoaProxy } from '@/modules/appliance/remote-resources/use-xoa-proxy.ts'
import type { XoaProxy, XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useEditProxy(rawProxy: MaybeRefOrGetter<XoaProxy>) {
  const proxy = toComputed(rawProxy)

  const { reloadProxy } = useXoaProxy()

  const payload = ref<XoaProxyPayload>()

  const { run: runSetProxy, isRunning: isEditingProxy } = useXoaProxySetJob(payload)

  const { run: runRemoveProxy, isRunning: isRemovingProxy } = useXoaProxyRemoveJob()

  const { open: openRemoveProxyModal } = useOverlay({
    component: () => import('@/modules/appliance/components/modal/RemoveProxyModal.vue'),
    events: {
      onConfirm: async () => {
        try {
          await runRemoveProxy()
        } catch (error) {
          console.error('Error when removing the proxy', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const { open } = useOverlay({
    component: () => import('@/modules/appliance/components/drawer/EditProxyDrawer.vue'),
    events: {
      onConfirm: async (newPayload: XoaProxyPayload) => {
        payload.value = newPayload

        try {
          await runSetProxy()
        } catch (error) {
          console.error('Error when editing the proxy', error)
          return KEEP_OVERLAY_OPEN
        }

        await reloadProxy()
      },
      onRemove: async () => {
        const { event } = await openRemoveProxyModal()

        if (event !== 'onConfirm') {
          return KEEP_OVERLAY_OPEN
        }

        await reloadProxy()
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    proxy: proxy.value,
  }))

  function openEditProxyDrawer() {
    return open({ props })
  }

  return {
    openEditProxyDrawer,
    isEditingProxy,
    isRemovingProxy,
  }
}
