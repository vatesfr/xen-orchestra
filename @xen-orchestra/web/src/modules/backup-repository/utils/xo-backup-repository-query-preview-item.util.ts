import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryType } from '@/modules/backup-repository/utils/xo-backup-repository-type.util.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'

export function toBackupRepositoryQueryPreviewItem(br: FrontXoBackupRepository): QueryBuilderPreviewItem {
  return {
    id: br.id,
    label: br.name,
    icon: getBackupRepositoryIcon(br, getBackupRepositoryType(br.url)),
    route: { name: '/admin/backup-repository/[id]/general', params: { id: br.id } },
  }
}
