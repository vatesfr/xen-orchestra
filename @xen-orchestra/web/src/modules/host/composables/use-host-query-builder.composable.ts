import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { HOST_POWER_STATE } from '@vates/types'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useHostQueryBuilder(
  id: string,
  hosts: MaybeRefOrGetter<FrontXoHost[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { items, filter } = useQueryBuilderFilter(id, hosts, options)

  const schema = useQueryBuilderSchema<FrontXoHost>({
    '': useStringSchema(t('any-property')),
    name_label: useStringSchema(t('name')),
    name_description: useStringSchema(t('description')),
    address: useStringSchema(t('ip-address')),
    power_state: useStringSchema(t('power-state'), {
      [HOST_POWER_STATE.RUNNING]: t('status:running'),
      [HOST_POWER_STATE.HALTED]: t('status:halted'),
      [HOST_POWER_STATE.UNKNOWN]: t('status:unknown'),
    }),
    tags: useStringSchema(t('tags')),
  })

  return { items, filter, schema }
}
