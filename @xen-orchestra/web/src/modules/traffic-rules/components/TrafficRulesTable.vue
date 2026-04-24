<template>
  <div class="traffic-rules-table">
    <UiTitle>
      {{ t('traffic-rules') }}
      <template #action>
        <UiButton variant="secondary" accent="brand" size="medium" left-icon="fa:plus">{{ t('new') }} </UiButton>
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
          <VtsRow v-for="rule of paginatedRules" :key="`${rule.id}:${rule.order}`">
            <BodyCells :item="rule" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import type { EnrichedTrafficRule, TrafficRule } from '@/modules/traffic-rules/types.ts'
import { getDirectionLabels } from '@/modules/traffic-rules/utils/direction-labels-utils.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useTrafficRulesColumns } from '@core/tables/column-sets/traffic-rules-columns.ts'
import { useBooleanSchema } from '@core/utils/query-builder/use-boolean-schema.ts'
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

const emit = defineEmits<{ select: [rule: TrafficRule] }>()

const { t } = useI18n()

const { getVifById } = useXoVifCollection()

const { getVmById } = useXoVmCollection()

const { getNetworkById } = useXoNetworkCollection()

const enrichedRules = computed(() =>
  rawRules.map((rule, index) => {
    const [directionA, directionB] = getDirectionLabels(rule)

    let objectLabel = ''
    if (rule.type === 'VIF') {
      const vif = getVifById(rule.sourceId)
      const vm = vif ? getVmById(vif.$VM) : undefined
      objectLabel = [vif ? t('vif-device', { device: vif.device }) : '', vm?.name_label ?? ''].filter(Boolean).join(' ')
    } else {
      const network = getNetworkById(rule.sourceId)
      objectLabel = network?.name_label ?? ''
    }

    return {
      ...rule,
      order: index + 1,
      directionA,
      directionB,
      direction: `${directionA} ${directionB}`,
      objectLabel,
    }
  })
)
const { filter, items: filteredRules } = useQueryBuilderFilter('trafficRule', () => enrichedRules.value)

const { pageRecords: paginatedRules, paginationBindings } = usePagination('trafficRules', filteredRules)

const schema = useQueryBuilderSchema<EnrichedTrafficRule>({
  '': useStringSchema(t('any-property')),
  allow: useBooleanSchema(t('traffic-rules:policy'), {
    true: t('traffic-rules:allow'),
    false: t('traffic-rules:drop'),
  }),
  protocol: useStringSchema(t('traffic-rules:protocol:port')),
  direction: useStringSchema(t('traffic-rules:direction')),
  ipRange: useStringSchema(t('traffic-rules:target')),
  objectLabel: useStringSchema(t('object')),
})

const { HeadCells, BodyCells } = useTrafficRulesColumns({
  body: (rule: EnrichedTrafficRule & { order: number }) => {
    return {
      order: r => r(rule.order),
      policy: r => r(rule.allow ? t('traffic-rules:allow') : t('traffic-rules:drop')),
      protocol: r => r(rule.port ? `${rule.protocol}:${rule.port}` : rule.protocol),
      directionA: r => r(rule.directionA),
      target: r => r(rule.ipRange),
      directionB: r => r(rule.directionB),
      object: r => {
        if (rule.type === 'VIF') {
          const vif = getVifById(rule.sourceId)
          const vm = vif ? getVmById(vif.$VM) : undefined
          return r({
            label: vif ? t('vif-device', { device: vif.device }) : '',
            icon: 'object:vif',
            to: vif ? { name: '/vm/[id]/networks', params: { id: vif.$VM } } : undefined,
            suffix: vm
              ? {
                  label: vm.name_label,
                  icon: `object:vm:${vm.power_state.toLowerCase()}` as IconName,
                  to: { name: '/vm/[id]/dashboard', params: { id: vm.id } },
                }
              : undefined,
          })
        }
        const network = getNetworkById(rule.sourceId)
        return r({
          label: network?.name_label ?? '',
          icon: 'object:network',
          to: network ? getPoolNetworkRoute(network.$pool, network.id) : undefined,
        })
      },
      selectItem: r => r(() => emit('select', rule)),
    }
  },
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawRules?.length === 0
      ? t('no-traffic-rules-detected')
      : filteredRules.value.length === 0
        ? { type: 'no-result' }
        : false,
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
