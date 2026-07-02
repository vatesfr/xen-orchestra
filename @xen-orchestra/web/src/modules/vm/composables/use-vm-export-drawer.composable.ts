import type { VmExportFormValues } from '@/modules/vm/components/drawer/VmExportDrawer.vue'
import { useXoVmExportJob, type VmExportCompression, type VmExportType } from '@/modules/vm/jobs/xo-vm-export.job'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection'
import { useDrawer } from '@core/packages/drawer/use-drawer'
import { toComputed } from '@core/utils/to-computed.util'
import { ref, type MaybeRefOrGetter } from 'vue'

export function useVmExportDrawer(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const exportType = ref<VmExportType>('xva')
  const exportCompression = ref<VmExportCompression>('none')

  const { run } = useXoVmExportJob(() => vm.value, exportType, exportCompression)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/vm/components/drawer/VmExportDrawer.vue'),
    onConfirm: async (values: VmExportFormValues) => {
      try {
        exportType.value = values.type
        exportCompression.value = values.compression

        await run()
      } catch (error) {
        console.error('Error when exporting VM:', error)
      }
    },
  }))

  return {
    openDrawer,
  }
}
