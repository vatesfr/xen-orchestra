<template>
  <UiCard>
    <CardTitle>{{ $t('hosts-status') }}</CardTitle>
    <LoadingHero :disabled="isReady" type="card">
      <DonutChartWithLegend :icon="faServer" :segments />
      <CardNumbers :label="t('total')" :value="hosts.length" class="total" size="small" />
    </LoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { HOST_POWER_STATE } from '@/types/xo/host.type'
import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import DonutChartWithLegend from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import UiCard from '@core/components/UiCard.vue'
import { useItemCounter } from '@core/composables/item-counter.composable'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: hosts, isReady } = useHostStore().subscribe()

const hostsCount = useItemCounter(hosts, {
  running: host => host.power_state === HOST_POWER_STATE.RUNNING,
  halted: host => host.power_state === HOST_POWER_STATE.HALTED,
})

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('hosts-status.running'),
    value: hostsCount.value.running,
    color: 'success',
  },
  {
    label: t('hosts-status.halted'),
    value: hostsCount.value.halted,
    color: 'warning',
  },
  {
    label: t('hosts-status.unknown'),
    value: hostsCount.value.$other,
    color: 'disabled',
    tooltip: t('hosts-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
