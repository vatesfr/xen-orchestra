<template>
  <UiCard>
    <UiCardTitle>{{ $t('vms-status') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :icon="faDesktop" :segments />
      <UiCardNumbers :label="t('total')" :value="vms.length" class="total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import { VM_POWER_STATE } from '@/types/xo/vm.type'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
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
    accent: 'success',
  },
  {
    label: t('vms-status.inactive'),
    value: vmsCount.value.inactive,
    accent: 'neutral',
    tooltip: t('vms-status.inactive.tooltip'),
  },
  {
    label: t('vms-status.unknown'),
    value: vmsCount.value.$other,
    accent: 'muted',
    tooltip: t('vms-status.unknown.tooltip'),
  },
])
</script>

<style lang="postcss" scoped>
.total {
  margin-left: auto;
}
</style>
