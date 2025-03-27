<template>
  <UiCard>
    <UiCardTitle>{{ $t('hosts-status') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :icon="faServer" :segments />
      <UiCardNumbers :label="t('total')" :value="hosts.length" class="total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { HOST_POWER_STATE } from '@/types/xo/host.type'
import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsDonutChartWithLegend from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
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
    accent: 'success',
  },
  {
    label: t('hosts-status.halted'),
    value: hostsCount.value.halted,
    accent: 'warning',
  },
  {
    label: t('hosts-status.unknown'),
    value: hostsCount.value.$other,
    accent: 'muted',
    tooltip: t('hosts-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
