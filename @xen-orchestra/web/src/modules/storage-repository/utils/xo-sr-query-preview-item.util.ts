import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getSrPageLocation } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import type { IconName } from '@core/icons'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'

export function toSrQueryPreviewItem(sr: FrontXoSr, icon: IconName): QueryBuilderPreviewItem {
  return {
    id: sr.id,
    label: sr.name_label,
    icon,
    route: getSrPageLocation(sr, { type: SR_SCOPE_TYPE.POOL }),
  }
}
