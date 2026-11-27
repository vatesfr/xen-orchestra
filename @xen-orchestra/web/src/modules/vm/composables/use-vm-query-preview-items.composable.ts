import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toVmQueryPreviewItem } from '@/modules/vm/utils/xo-vm-query-preview-item.util.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useVmQueryPreviewItems(rawVms: MaybeRefOrGetter<FrontXoVm[]>) {
  const vms = toComputed(rawVms)

  return computed<QueryBuilderPreviewItem[]>(() =>
    vms.value.map(vm => toVmQueryPreviewItem(vm.id, vm.name_label, vm.power_state))
  )
}
