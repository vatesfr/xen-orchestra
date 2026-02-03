<template>
  <UiCard class="host-dashboard-vms-status">
    <UiCardTitle>{{ t('vms-status') }}</UiCardTitle>
    <VtsStateHero v-if="!isReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VtsDonutChartWithLegend :segments />
      <UiCardNumbers :label="t('total')" :value="total" size="small" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useItemCounter } from '@core/composables/item-counter.composable.ts'
import { VM_POWER_STATE, type XoHost } from '@vates/types'
import { logicAnd, useSum } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { areHostsReady } = useXoHostCollection()
const { vmsByHost, areVmsReady } = useXoVmCollection()

const isReady = logicAnd(areHostsReady, areVmsReady)

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
    label: t('vm:status:running', 2),
    value: vmsStatuses.value.running,
    accent: 'success',
  },
  {
    label: t('vm:status:paused', 2),
    value: vmsStatuses.value.paused,
    accent: 'info',
  },
  {
    label: t('vm:status:suspended', 2),
    value: vmsStatuses.value.suspended,
    accent: 'neutral',
  },
  {
    label: t('vm:status:halted', 2),
    value: vmsStatuses.value.halted,
    accent: 'danger',
  },
])
</script>
