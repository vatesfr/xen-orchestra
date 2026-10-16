import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoBackupLog } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useBackupLogSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoBackupLog>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    status: useStringSchema(t('status'), {
      success: t('success'),
      skipped: t('skipped'),
      interrupted: t('interrupted'),
      failure: t('failure'),
      pending: t('pending'),
    }),
    jobId: useStringSchema(t('backup-job')),
  })
}
