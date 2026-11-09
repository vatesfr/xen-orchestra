import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoServer } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useServerSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoServer>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    label: useStringSchema(t('name')),
    host: useStringSchema(t('host')),
    status: useStringSchema(t('status'), {
      connected: t('connected'),
      connecting: t('connecting'),
      disconnected: t('disconnected'),
      disconnecting: t('disconnecting'),
    }),
    enabled: useBooleanSchema(t('state'), {
      true: t('enabled'),
      false: t('disabled'),
    }),
    readOnly: useBooleanSchema(t('read-only'), {
      true: t('yes'),
      false: t('no'),
    }),
    username: useStringSchema(t('username')),
  })
}
