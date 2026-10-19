import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import type { PropertySchema, QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { parseValues } from '@core/packages/query-builder/schema/parse-values.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { V2V_VM_POWER_STATE } from '@vates/types'
import { mapValues } from 'lodash-es'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

function withEnumeratedValues(property: PropertySchema, values: string[]): PropertySchema {
  const valueSchemas = parseValues(Object.fromEntries(values.map(value => [value, value])))

  return {
    ...property,
    operators: mapValues(property.operators, operator =>
      operator.values === undefined ? operator : { ...operator, values: valueSchemas }
    ),
  }
}

export function useV2vVmQueryBuilder(rows: MaybeRefOrGetter<V2vVmRow[]>, datastoreNames: MaybeRefOrGetter<string[]>) {
  const { t } = useI18n()

  const { items, filter } = useQueryBuilderFilter('v2v-vms', rows)

  const staticSchema = useQueryBuilderSchema<V2vVmRow>({
    '': useStringSchema(t('any-property')),
    name: useStringSchema(t('name')),
    datastore: useStringSchema(t('datastores'), {}),
    migration: useStringSchema(t('migration'), {
      none: t('not-migrated'),
      running: t('in-progress'),
      warm: t('v2v:status:warm'),
      cold: t('v2v:status:cold'),
    }),
    power: useStringSchema(t('power-state'), {
      [V2V_VM_POWER_STATE.POWERED_ON]: t('vm:status:running'),
      [V2V_VM_POWER_STATE.POWERED_OFF]: t('vm:status:halted'),
      [V2V_VM_POWER_STATE.SUSPENDED]: t('vm:status:suspended'),
    }),
    supported: useBooleanSchema(t('supported'), {
      true: t('supported'),
      false: t('unsupported'),
    }),
  })

  // useStringSchema needs the setup context to translate its operators: it runs once, only the datastore values follow
  // the inventory
  const schema = computed<QueryBuilderSchema>(() => ({
    ...staticSchema,
    datastore: withEnumeratedValues(staticSchema.datastore, toValue(datastoreNames)),
  }))

  return { items, filter, schema }
}
