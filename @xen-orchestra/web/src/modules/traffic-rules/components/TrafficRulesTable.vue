<template>
  <div class="traffic-rules-table">
    <UiTitle>
      {{ t('traffic-rules') }}
      <template #action>
        <slot name="title-action" />
      </template>
    </UiTitle>
    <UiAlert accent="info">{{ t('traffic-rules:info-message') }}</UiAlert>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow
            v-for="rule of paginatedRules"
            :key="`${rule.id}:${rule.order}`"
            :selected="selectedRuleId === rule.id"
          >
            <BodyCells :item="rule" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTrafficRuleTarget } from '@/modules/traffic-rules/composables/traffic-rule-target.composable.ts'
import type { EnrichedTrafficRule, TrafficRule } from '@/modules/traffic-rules/types.ts'
import { getDirectionLabels } from '@/modules/traffic-rules/utils/direction-labels.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useTrafficRulesColumns } from '@core/tables/column-sets/traffic-rules-columns.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  rules: rawRules,
  busy,
  error,
} = defineProps<{
  rules: TrafficRule[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedRuleId = useRouteQuery('id')

const getTarget = useTrafficRuleTarget()

const enrichedRules = computed(() =>
  rawRules.map((rule, index) => {
    const [directionA, directionB] = getDirectionLabels(rule)

    const target = getTarget(rule)

    return {
      ...rule,
      order: index + 1,
      directionA,
      directionB,
      direction: `${directionA} ${directionB}`,
      objectLabel: target.suffix ? `${target.label} ${target.suffix.label}` : target.label,
    }
  })
)
const { filter, items: filteredRules } = useQueryBuilderFilter('trafficRule', () => enrichedRules.value)

const { pageRecords: paginatedRules, paginationBindings } = usePagination('trafficRules', filteredRules)

const schema = useQueryBuilderSchema<EnrichedTrafficRule>({
  '': useStringSchema(t('any-property')),
  allow: useBooleanSchema(t('policy'), {
    true: t('allow'),
    false: t('drop'),
  }),
  protocol: useStringSchema(t('protocol')),
  port: useNumberSchema(t('port')),
  direction: useStringSchema(t('direction')),
  ipRange: useStringSchema(t('target')),
  objectLabel: useStringSchema(t('object')),
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawRules?.length === 0
      ? t('traffic-rules:no-traffic-rules-detected')
      : filteredRules.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useTrafficRulesColumns({
  body: (rule: EnrichedTrafficRule & { order: number }) => {
    return {
      order: r => r(rule.order),
      policy: r => r(rule.allow ? t('allow') : t('drop')),
      protocol: r => r(rule.port ? `${rule.protocol}:${rule.port}` : rule.protocol),
      directionA: r => r(rule.directionA),
      target: r => r(rule.ipRange),
      directionB: r => r(rule.directionB),
      object: r => r(getTarget(rule)),
      selectItem: r => r(() => (selectedRuleId.value = rule.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.traffic-rules-table,
.container {
  display: flex;
  flex-direction: column;
}

.traffic-rules-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
