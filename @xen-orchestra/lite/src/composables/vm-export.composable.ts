import type { VM_COMPRESSION_TYPE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

export function useVmExport() {
  const xapi = useXenApiStore().getXapi()

  const { open: openBlockedUrlsModal } = useOverlay({
    component: () => import('@/components/modals/VmExportBlockedUrlsModal.vue'),
    events: {
      onClose: true,
    },
  })

  async function exportVms(vmRefs: XenApiVm['$ref'][], compression: VM_COMPRESSION_TYPE) {
    const { blockedUrls } = await xapi.vm.export(vmRefs, compression)

    if (blockedUrls.length === 0) {
      return
    }

    openBlockedUrlsModal({ props: { blockedUrls } })
  }

  return { exportVms }
}
