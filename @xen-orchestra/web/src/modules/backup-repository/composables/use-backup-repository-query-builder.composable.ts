import { type BackupRepositoryFilterableData, useBackupRepositoryEnhancedData } from '@/modules/backup-repository/composables/use-backup-repository-enhanced-data.composable.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { BACKUP_REPOSITORY_TYPE } from 'xo-remote-parser'

export function useBackupRepositoryQueryBuilder(
  id: string,
  rawBrs: MaybeRefOrGetter<FrontXoBackupRepository[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { filterableBrs } = useBackupRepositoryEnhancedData(rawBrs)

  const { items, filter } = useQueryBuilderFilter(id, filterableBrs, options)

  const typeLabels = Object.fromEntries(
    Object.values(BACKUP_REPOSITORY_TYPE).map(type => [type, useXoBackupRepositoryTypeLabel(type).value])
  )

  const schema = useQueryBuilderSchema<BackupRepositoryFilterableData>({
    '': useStringSchema(t('any-property')),
    name: useStringSchema(t('name')),
    url: useStringSchema(t('url')),
    type: useStringSchema(t('type'), typeLabels),
    status: useStringSchema(t('status'), {
      enabled: t('enabled'),
      disabled: t('disabled'),
      'unable-to-connect': t('unable-to-connect'),
    }),
    storageMode: useStringSchema(t('storage-mode'), {
      block: t('block-based'),
      vhd: t('vhd-file'),
    }),
  })

  return { items, filter, schema }
}
