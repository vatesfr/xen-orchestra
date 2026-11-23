import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vVmRow } from '@/modules/v2v/types/v2v-vm-row.type.ts'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { withEnumeratedValues } from '@core/packages/query-builder/schema/with-enumerated-values.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function useV2vVmQueryBuilder(
  id: string,
  rows: MaybeRefOrGetter<V2vVmRow[]>,
  datastoreNames: MaybeRefOrGetter<string[]>,
  options?: Parameters<typeof useQueryBuilderFilter>[2]
) {
  const { t } = useI18n()

  const { statusLabels, powerLabels } = useV2vVmLabels()

  const queryBuilderFilter = useQueryBuilderFilter(id, rows, options)

  const staticSchema = useQueryBuilderSchema<V2vVmRow>({
    '': useStringSchema(t('any-property')),
    name: useStringSchema(t('name')),
    datastore: useStringSchema(t('datastores'), {}),
    migration: useStringSchema(t('migration'), statusLabels.value),
    power: useStringSchema(t('power-state'), powerLabels.value),
    supported: useBooleanSchema(t('supported'), {
      true: t('supported'),
      false: t('unsupported'),
    }),
  })

  // useStringSchema needs the setup context to translate its operators: it runs once, labels included (a language change
  // reloads the app), only the datastore values follow the inventory
  const schema = computed<QueryBuilderSchema>(() => ({
    ...staticSchema,
    datastore: withEnumeratedValues(staticSchema.datastore, toValue(datastoreNames)),
  }))

  return { ...queryBuilderFilter, schema }
}
