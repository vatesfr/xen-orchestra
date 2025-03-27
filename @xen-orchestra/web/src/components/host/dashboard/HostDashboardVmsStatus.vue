<template>
  <UiCard class="host-dashboard-vms-status">
    <UiCardTitle>{{ $t('vms-status') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :segments />
      <UiCardNumbers class="total" :label="$t('total')" :value="total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoHost } from '@/types/xo/host.type'
import { VM_POWER_STATE } from '@/types/xo/vm.type'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useItemCounter } from '@core/composables/item-counter.composable'
import { useSum } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { isReady: isHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady } = useVmStore().subscribe()

const isReady = computed(() => isHostReady.value && areVmsReady.value)

const hostVms = computed(() => vmsByHost.value.get(host.id) ?? [])

const { t } = useI18n()

const vmsStatuses = useItemCounter(hostVms, {
  running: vm => vm.power_state === VM_POWER_STATE.RUNNING,
  paused: vm => vm.power_state === VM_POWER_STATE.PAUSED,
  suspended: vm => vm.power_state === VM_POWER_STATE.SUSPENDED,
  halted: vm => vm.power_state === VM_POWER_STATE.HALTED,
})

const total = useSum(() => Object.values(vmsStatuses.value))

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: vmsStatuses.value.running,
    accent: 'success',
  },
  {
    label: t('vms-status.paused'),
    value: vmsStatuses.value.paused,
    accent: 'info',
  },
  {
    label: t('vms-status.suspended'),
    value: vmsStatuses.value.suspended,
    accent: 'neutral',
  },
  {
    label: t('vms-status.halted'),
    value: vmsStatuses.value.halted,
    accent: 'danger',
  },
])
</script>

<style lang="postcss" scoped>
.host-dashboard-vms-status {
  .total {
    margin-inline-start: auto;
  }
}
</style>
