<template v-if="isReady">
  <UiCard>
    <CardTitle>{{ $t('vms-status') }}</CardTitle>
    <DonutChartWithLegend :icon="faDesktop" :segments />
    <CardNumbers :value="vm.length" class="total" label="Total" size="small" />
  </UiCard>
</template>

<script lang="ts" setup>
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import DonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import UiCard from '@core/components/UiCard.vue'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: vm } = useVmStore().subscribe()

const vmsCount = computed(() =>
  vm.value.reduce(
    (acc, vm) => {
      if (vm.power_state === 'Running' || vm.power_state === 'Paused') {
        acc.running++
      } else if (vm.power_state === 'Halted' || vm.power_state === 'Suspended') {
        acc.inactive++
      } else {
        acc.unknown++
      }

      return acc
    },
    { running: 0, inactive: 0, unknown: 0 }
  )
)

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: vmsCount.value.running,
    color: 'success',
  },
  {
    label: t('vms-status.inactive'),
    value: vmsCount.value.inactive,
    color: 'secondary',
    tooltip: t('vms-status.inactive.tooltip'),
  },
  {
    label: t('vms-status.unknown'),
    value: vmsCount.value.unknown,
    color: 'disabled',
    tooltip: t('vms-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
