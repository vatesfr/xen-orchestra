<template>
  <UiCard class="pool-dashboard-vms-status">
    <UiCardTitle>{{ t('status') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :segments="segmentsHost" :title="{ label: t('hosts') }" :icon="faServer" />
      <UiCardNumbers class="total" :label="t('total')" :value="totalHost" size="small" />
      <VtsDivider type="stretch" />
      <VtsDonutChartWithLegend :segments="segmentsVm" :title="{ label: t('vms', totalVm) }" :icon="faDisplay" />
      <UiCardNumbers class="total" :label="t('total')" :value="totalVm" size="small" />
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import { HOST_POWER_STATE } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import { VM_POWER_STATE } from '@/types/xo/vm.type'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useItemCounter } from '@core/composables/item-counter.composable'
import { faDisplay, faServer } from '@fortawesome/free-solid-svg-icons'
import { useSum } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { isReady: isPoolReady } = usePoolStore().subscribe()
const { isReady: isHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady, hostLessVmsByPool } = useVmStore().subscribe()
const { hostsByPool, isReady: areHostReady } = useHostStore().subscribe()

const isReady = computed(() => isPoolReady.value && areHostReady.value && isHostReady.value && areVmsReady.value)
const poolHosts = computed(() => hostsByPool.value.get(pool.id) ?? [])
const hostVms = computed(() => [
  ...poolHosts.value.flatMap(host => vmsByHost.value.get(host.id) ?? []),
  ...(hostLessVmsByPool.value.get(pool.id) ?? []),
])

const { t } = useI18n()

const HostStatuses = useItemCounter(poolHosts, {
  running: host => host.power_state === HOST_POWER_STATE.RUNNING,
  disable: host => host.power_state === HOST_POWER_STATE.UNKNOWN,
  halted: host => host.power_state === HOST_POWER_STATE.HALTED,
})
const vmsStatuses = useItemCounter(hostVms, {
  running: vm => vm.power_state === VM_POWER_STATE.RUNNING,
  paused: vm => vm.power_state === VM_POWER_STATE.PAUSED,
  suspended: vm => vm.power_state === VM_POWER_STATE.SUSPENDED,
  halted: vm => vm.power_state === VM_POWER_STATE.HALTED,
})

const totalHost = useSum(() => Object.values(HostStatuses.value))
const totalVm = useSum(() => Object.values(vmsStatuses.value))
const segmentsHost = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: HostStatuses.value.running,
    accent: 'success',
  },
  {
    label: t('vms-status.suspended'),
    value: HostStatuses.value.disable,
    accent: 'neutral',
  },
  {
    label: t('vms-status.halted'),
    value: HostStatuses.value.halted,
    accent: 'danger',
  },
])
const segmentsVm = computed<DonutChartWithLegendProps['segments']>(() => [
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
