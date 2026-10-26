import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import { objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { toLower } from 'lodash-es'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useVmQueryPreviewItems(rawVms: MaybeRefOrGetter<FrontXoVm[]>) {
  const vms = toComputed(rawVms)

  return computed<QueryBuilderPreviewItem[]>(() =>
    vms.value.map(vm => ({
      id: vm.id,
      label: vm.name_label,
      icon: objectIcon('vm', toLower(vm.power_state)),
      route: `/vm/${vm.id}/dashboard`,
    }))
  )
}
