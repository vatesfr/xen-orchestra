<template v-if="isReady">
  <UiCard>
    <CardTitle>{{ $t('hosts-status') }}</CardTitle>
    <DonutChartWithLegend :icon="faServer" :segments />
    <CardNumbers :value="hosts.length" class="total" label="Total" size="small" />
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { HOST_POWER_STATE } from '@/types/host.type'
import type { DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import DonutChartWithLegend from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import UiCard from '@core/components/UiCard.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: hosts } = useHostStore().subscribe()

const hostsCount = computed(() => {
  return hosts.value.reduce(
    (acc, host) => {
      if (host.power_state === HOST_POWER_STATE.RUNNING) {
        acc.running++
      } else if (host.power_state === HOST_POWER_STATE.HALTED) {
        acc.halted++
      } else {
        acc.unknown++
      }

      return acc
    },
    { running: 0, halted: 0, unknown: 0 }
  )
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
    value: hostsCount.value.unknown,
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
