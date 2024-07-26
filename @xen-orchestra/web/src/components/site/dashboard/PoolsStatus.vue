<template>
  <UiCard>
    <CardTitle>{{ $t('pools-status') }}</CardTitle>
    <LoadingHero :disabled="isReady" type="card">
      <DonutChartWithLegend :icon="faCity" :segments />
      <CardNumbers :value="servers.length" class="total" label="Total" size="small" />
    </LoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import { SERVER_STATUS } from '@/types/server.type'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import DonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import UiCard from '@core/components/UiCard.vue'
import { useItemCounter } from '@core/composables/item-counter.composable'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: servers, isReady } = useServerStore().subscribe()

const serversCount = useItemCounter(servers, {
  connected: ({ status }) => status === SERVER_STATUS.CONNECTED,
  unreachable: ({ status }) => status === SERVER_STATUS.DISCONNECTED,
})

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('pools-status.connected'),
    value: serversCount.value.connected,
    color: 'success',
  },
  {
    label: t('pools-status.unreachable'),
    value: serversCount.value.unreachable,
    color: 'warning',
    tooltip: t('pools-status.unreachable.tooltip'),
  },
  {
    label: t('pools-status.unknown'),
    value: serversCount.value.$other,
    color: 'disabled',
    tooltip: t('pools-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
