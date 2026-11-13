import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'

export function toPoolQueryPreviewItem(id: FrontXoPool['id'], label: string): QueryBuilderPreviewItem {
  return {
    id,
    label,
    icon: 'object:pool',
    route: { name: '/pool/[id]/dashboard', params: { id } },
  }
}
