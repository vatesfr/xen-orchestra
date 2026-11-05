import type { VmExportFormValues } from '@/modules/vm/components/drawer/VmExportDrawer.vue'
import { useXoVmExportJob, type VmExportCompression, type VmExportType } from '@/modules/vm/jobs/xo-vm-export.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useVmExport(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const exportType = ref<VmExportType>('xva')
  const exportCompression = ref<VmExportCompression>('none')

  const { run } = useXoVmExportJob(() => vm.value, exportType, exportCompression)

  const { open: exportVm } = useOverlay({
    component: () => import('@/modules/vm/components/drawer/VmExportDrawer.vue'),
    events: {
      onConfirm: (values: VmExportFormValues) => {
        exportType.value = values.type
        exportCompression.value = values.compression

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  return {
    exportVm,
  }
}
