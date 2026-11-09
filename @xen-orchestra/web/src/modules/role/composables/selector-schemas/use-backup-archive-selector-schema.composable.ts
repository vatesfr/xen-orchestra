import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoVmBackupArchive } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useBackupArchiveSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoVmBackupArchive>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    mode: useStringSchema(t('mode'), {
      full: t('backup:full'),
      delta: t('backup:incremental'),
    }),
    backupRepository: useStringSchema(t('backup-repository')),
    jobId: useStringSchema(t('backup-job')),
    scheduleId: useStringSchema(t('schedule')),
  })
}
