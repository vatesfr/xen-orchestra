import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoSchedule } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useScheduleSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoSchedule>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name: useStringSchema(t('name')),
    enabled: useBooleanSchema(t('state'), {
      true: t('enabled'),
      false: t('disabled'),
    }),
    jobId: useStringSchema(t('backup-job')),
    cron: useStringSchema(t('cron-pattern')),
    timezone: useStringSchema(t('timezone')),
  })
}
