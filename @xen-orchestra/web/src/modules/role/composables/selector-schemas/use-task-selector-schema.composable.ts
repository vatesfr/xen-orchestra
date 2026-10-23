import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useTaskSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoTask>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    'properties:name': useStringSchema(t('name')),
    status: useStringSchema(t('status'), {
      success: t('success'),
      failure: t('failure'),
      interrupted: t('interrupted'),
      pending: t('pending'),
    }),
    'properties:objectId': useStringSchema(t('object')),
  })
}
