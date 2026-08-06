import { useXoVdiExportJob } from '@/modules/vdi/jobs/xo-vdi-export.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { VdiExportFormat } from '@/shared/constants.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { SUPPORTED_VDI_FORMAT } from '@vates/types'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVdiExport(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const vdi = toComputed(rawVdi)
  const selectedFormat = ref<VdiExportFormat>(SUPPORTED_VDI_FORMAT.vhd)

  const { run, isRunning: isExportingVdi } = useXoVdiExportJob(vdi, selectedFormat)

  const { open: exportVdi } = useOverlay({
    component: () => import('@/modules/vdi/components/drawer/VdiExportDrawer.vue'),
    events: {
      onConfirm: async format => {
        try {
          selectedFormat.value = format
          await run()
        } catch (error) {
          console.error('Error when exporting VDI:', error)
        }
      },
      onCancel: true,
    },
  })

  return { exportVdi, isExportingVdi }
}
