<template>
  <UiCard>
    <UiCardTitle>{{ $t('pools-status') }}</UiCardTitle>
    <VtsLoadingHero :disabled="isReady" type="card">
      <VtsDonutChartWithLegend :icon="faCity" :segments />
      <UiCardNumbers :value="servers.length" class="total" label="Total" size="small" />
    </VtsLoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import { SERVER_STATUS } from '@/types/xo/server.type'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useItemCounter } from '@core/composables/item-counter.composable'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: servers, isReady } = useServerStore().subscribe()
const { has: hasPool } = usePoolStore().subscribe()

const serversCount = useItemCounter(servers, {
  connected: server => server.status === SERVER_STATUS.CONNECTED && hasPool(server.poolId),
  unreachable: ({ status }) => status === SERVER_STATUS.DISCONNECTED,
})

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('pools-status.connected'),
    value: serversCount.value.connected,
    accent: 'success',
  },
  {
    label: t('pools-status.unreachable'),
    value: serversCount.value.unreachable,
    accent: 'warning',
    tooltip: t('pools-status.unreachable.tooltip'),
  },
  {
    label: t('pools-status.unknown'),
    value: serversCount.value.$other,
    accent: 'muted',
    tooltip: t('pools-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
