import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import { objectIcon } from '@core/icons'
import { toLower } from 'lodash-es'

export function toVmQueryPreviewItem(
  id: FrontXoVm['id'],
  label: string,
  powerState: FrontXoVm['power_state'] | undefined
): QueryBuilderPreviewItem {
  return {
    id,
    label,
    icon: powerState !== undefined ? objectIcon('vm', toLower(powerState)) : 'object:vm:unknown',
    route: `/vm/${id}/dashboard`,
  }
}
