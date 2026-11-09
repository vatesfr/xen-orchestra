import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { HOST_POWER_STATE, type XoHost } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useHostSelectorSchema(): QueryBuilderSchema {
  const { t } = useI18n()

  return useQueryBuilderSchema<XoHost>({
    '': useStringSchema(t('any-property')),
    id: useStringSchema(t('id')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    power_state: useStringSchema(t('power-state'), {
      [HOST_POWER_STATE.RUNNING]: t('status:running'),
      [HOST_POWER_STATE.HALTED]: t('status:halted'),
      [HOST_POWER_STATE.UNKNOWN]: t('status:unknown'),
    }),
    address: useStringSchema(t('ip-address')),
    tags: useStringSchema(t('tags')),
    $pool: useStringSchema(t('pool')),
  })
}
