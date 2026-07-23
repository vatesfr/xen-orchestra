<template>
  <div class="traffic-rules-table">
    <UiTitle>
      {{ t('traffic-rules') }}
      <template #action>
        <slot name="title-action" />
      </template>
    </UiTitle>
    <UiAlert accent="info">{{ t('traffic-rules:info-message') }}</UiAlert>
    <UiAlert v-if="showRulesFormatWarning" accent="warning">
      <I18nT keypath="traffic-rules:format-warning">
        <template #check-doc>
          <UiLink size="small" href="https://docs.xen-orchestra.com/xo5/sdn_controller#migration-path">
            {{ t('traffic-rules:format-warning:check-doc') }}
          </UiLink>
        </template>
      </I18nT>
    </UiAlert>
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
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useDirectionLabels } from '@/modules/traffic-rules/composables/direction-labels.composable.ts'
import { useTrafficRuleTarget } from '@/modules/traffic-rules/composables/traffic-rule-target.composable.ts'
import { useTrafficRuleDeleteModal } from '@/modules/traffic-rules/composables/use-traffic-rule-delete-modal.composable.ts'
import { useTrafficRuleEditDrawer } from '@/modules/traffic-rules/composables/use-traffic-rule-edit-drawer.composable.ts'
import type { EnrichedTrafficRule } from '@/modules/traffic-rules/types.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
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
import { SDN_CONTROLLER_OF_FORMAT_KEY, SDN_CONTROLLER_OF_METHOD_KEY, type TrafficRule } from '@vates/types'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  rules: rawRules,
  pool,
  busy,
  error,
} = defineProps<{
  rules: TrafficRule[]
  pool?: FrontXoPool
  busy?: boolean
  error?: boolean
}>()

defineSlots<{
  'title-action'(): any
}>()

const { t } = useI18n()

const selectedRuleId = useRouteQuery('id')

const getTarget = useTrafficRuleTarget()

const getDirectionLabels = useDirectionLabels()

const showRulesFormatWarning = computed(() => {
  const ofMethod = pool?.otherConfig[SDN_CONTROLLER_OF_METHOD_KEY]
  const ofFormat = pool?.otherConfig[SDN_CONTROLLER_OF_FORMAT_KEY]
  return ofMethod !== undefined && ofFormat !== undefined && ofMethod !== ofFormat
})

const enrichedRules = computed(() =>
  rawRules.map((rule, index) => {
    const target = getTarget(rule)
    const [directionA, directionB] = getDirectionLabels(rule)

    return {
      ...rule,
      order: index + 1,
      directionA,
      directionB,
      directionLabel: `${directionA} ${directionB}`,
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
  directionLabel: useStringSchema(t('direction')),
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
  body: (rule: EnrichedTrafficRule) => {
    const {
      openModal: openTrafficRuleDeleteModal,
      canRun: canDeleteTrafficRule,
      isRunning: isDeletingTrafficRule,
      errorMessage: deleteTrafficRuleErrorMessage,
    } = useTrafficRuleDeleteModal(() => [rule])

    const {
      openDrawer: openTrafficRuleEditDrawer,
      isRunning: isEditingTrafficRule,
      canRun: canEditTrafficRule,
    } = useTrafficRuleEditDrawer(() => rule)

    return {
      order: r => r(rule.order),
      policy: r => r(t(rule.allow ? 'allow' : 'drop'), rule.allow ? 'success' : 'danger'),
      protocol: r => r(rule.port ? `${rule.protocol}:${rule.port}` : rule.protocol),
      directionA: r => r(rule.directionA),
      target: r => r(rule.ipRange),
      directionB: r => r(rule.directionB),
      object: r => r(getTarget(rule)),
      actions: r =>
        r({
          onClick: () => (selectedRuleId.value = rule.id),
          actions: [
            {
              label: t('action:edit'),
              icon: 'action:edit',
              onClick: () => openTrafficRuleEditDrawer(),
              busy: isEditingTrafficRule.value,
              disabled: !canEditTrafficRule.value,
            },
            {
              label: t('action:delete'),
              icon: 'action:delete',
              onClick: () => openTrafficRuleDeleteModal(),
              disabled: !canDeleteTrafficRule.value,
              busy: isDeletingTrafficRule.value,
              hint: deleteTrafficRuleErrorMessage.value,
            },
          ],
        }),
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
