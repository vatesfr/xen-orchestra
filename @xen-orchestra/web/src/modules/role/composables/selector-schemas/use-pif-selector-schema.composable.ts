import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import type { XoPif } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function usePifSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoPif>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    device: useStringSchema(t('device')),
    ip: useStringSchema(t('ip-address')),
    mac: useStringSchema(t('mac-address')),
    management: useBooleanSchema(t('management'), {
      true: t('yes'),
      false: t('no'),
    }),
    attached: useBooleanSchema(t('status'), {
      true: t('connected'),
      false: t('disconnected'),
    }),
    $host: useStringSchema(t('host')),
    $network: useStringSchema(t('network')),
    $pool: useStringSchema(t('pool')),
  })
}
