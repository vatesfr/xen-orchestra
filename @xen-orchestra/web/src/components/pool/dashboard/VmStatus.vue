<template v-if="isReady">
  <UiCard>
    <CardTitle>{{ $t('vms-status') }}</CardTitle>
    <DonutWithLegends :segments="segments" :icon />
    <CardNumbers label="Total" :value="vm.length" size="small" class="right" />
  </UiCard>
</template>

<script lang="ts" setup>
import DonutWithLegends from '@/components/DonutWithLegends.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { Vm } from '@/types/vm.type'
import type { LegendColor } from '@core/types/ui-legend.type'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import UiCard from '@core/components/UiCard.vue'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records: vm, isReady } = useVmStore().subscribe()

const runningVmsCount = computed(() => {
  if (!isReady.value) return 0
  return vm.value.filter((vm: Vm) => vm.power_state === 'Running').length
})

const inactiveVmsCount = computed(() => {
  if (!isReady.value) return 0
  return vm.value.filter((vm: Vm) => vm.power_state === 'Halted').length
})

const unknownVmsCount = computed(() => {
  if (!isReady.value) return 0
  return vm.value.filter((vm: Vm) => vm.power_state !== 'Running' && vm.power_state !== 'Halted').length
})

const segments = computed(() => [
  {
    label: t('vms-running-status'),
    value: runningVmsCount.value,
    color: 'success' as LegendColor,
  },
  {
    label: t('vms-halted-status'),
    value: inactiveVmsCount.value,
    color: 'dark-blue' as LegendColor,
    tooltip: t('vms-halted-status-tooltip'),
  },
  {
    label: t('vms-unknown-status'),
    value: unknownVmsCount.value,
    color: 'disabled' as LegendColor,
    tooltip: t('vms-unknown-status-tooltip'),
  },
])

const icon = faDesktop
</script>

<style lang="postcss" scoped>
.right {
  margin-left: auto;
}
</style>
