<template>
  <UiCard>
    <CardTitle>{{ $t('vms-status') }}</CardTitle>
    <LoadingHero :disabled="isReady" type="card">
      <DonutChartWithLegend :icon="faDesktop" :segments />
      <CardNumbers :label="t('total')" :value="vms.length" class="total" size="small" />
    </LoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import { VM_POWER_STATE } from '@/types/xo/vm.type'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import DonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/DonutChartWithLegend.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import UiCard from '@core/components/UiCard.vue'
import { useItemCounter } from '@core/composables/item-counter.composable'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: vms, isReady } = useVmStore().subscribe()

const vmsCount = useItemCounter(vms, {
  running: vm => vm.power_state === VM_POWER_STATE.RUNNING || vm.power_state === VM_POWER_STATE.PAUSED,
  inactive: vm => vm.power_state === VM_POWER_STATE.HALTED || vm.power_state === VM_POWER_STATE.SUSPENDED,
})

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
    value: vmsCount.value.$other,
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
