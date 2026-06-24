import { useXoVdiExportJob } from '@/modules/vdi/jobs/xo-vdi-export.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { vdiExportFormat } from '@/shared/constants.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { SUPPORTED_VDI_FORMAT } from '@vates/types'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVdiExportDrawer(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const vdi = toComputed(rawVdi)
  const selectedFormat = ref<vdiExportFormat>(SUPPORTED_VDI_FORMAT.vhd)

  const { run, isRunning } = useXoVdiExportJob(vdi, selectedFormat)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/vdi/components/drawer/VdiExportDrawer.vue'),
    onConfirm: async (format: vdiExportFormat) => {
      try {
        selectedFormat.value = format
        await run()
      } catch (error) {
        console.error('Error when exporting VDI:', error)
      }
    },
  }))

  return { openDrawer, isRunning }
}
