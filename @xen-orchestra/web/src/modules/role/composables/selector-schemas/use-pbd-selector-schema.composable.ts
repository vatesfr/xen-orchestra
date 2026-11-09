import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoPbd } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function usePbdSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoPbd>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    attached: useBooleanSchema(t('status'), {
      true: t('connected'),
      false: t('disconnected'),
    }),
    host: useStringSchema(t('host')),
    SR: useStringSchema(t('sr')),
    $pool: useStringSchema(t('pool')),
  })
}
