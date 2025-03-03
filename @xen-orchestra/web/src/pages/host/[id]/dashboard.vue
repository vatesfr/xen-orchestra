<template>
  <div class="dashboard" />
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import { type XoHost } from '@/types/xo/host.type'
import type { POWER_STATE } from '@core/types/power-state.type'
import { type DonutChartWithLegendProps } from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import { type IconAccent } from '@core/components/icon/VtsIcon.vue'
import useRelativeTime from '@core/composables/relative-time.composable'
import { formatSizeRaw } from '@core/utils/size.util'
import { parseDateTime } from '@core/utils/time.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { isMasterHost, isReady: isHostReady } = useHostStore().subscribe()
const { vmsByHost, isReady: areVmsReady } = useVmStore().subscribe()

const isReady = computed(() => isHostReady.value && areVmsReady.value)

const hostVms = computed(() => vmsByHost.value.get(host.id) ?? [])

// Power state
const powerStateConfig: Record<
  string,
  {
    icon: IconDefinition | undefined
    accent: IconAccent
  }
> = {
  running: { icon: faPlay, accent: 'success' },
  halted: { icon: faStop, accent: 'danger' },
  unknown: { icon: undefined, accent: 'warning' },
}

const powerState = computed(() => {
  const state = host.power_state.toLowerCase()
  const config = powerStateConfig[state]

  return {
    text: t(`host-status.${state}`),
    icon: config.icon,
    accent: config.accent,
  }
})

// Start time
const date = computed(() => new Date(parseDateTime(host.startTime * 1000)))
const now = useNow({ interval: 1000 })
const relativeStartTime = useRelativeTime(date, now)

// Is master host
const isMaster = computed(() => isMasterHost(host.id))

// Total RAM
const ram = computed(() => formatSizeRaw(host.memory.size, 1))

// VMs statuses for donut chart
const vmsStatuses = computed(() =>
  hostVms.value.reduce(
    (acc, vm) => {
      acc[vm.power_state.toLowerCase() as POWER_STATE] += 1

      return acc
    },
    {
      running: 0,
      paused: 0,
      suspended: 0,
      halted: 0,
    } as Record<POWER_STATE, number>
  )
)

const vmsSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('vms-status.running'),
    value: vmsStatuses.value.running,
    accent: 'success',
  },
  {
    label: t('vms-status.inactive'),
    value: vmsStatuses.value.suspended + vmsStatuses.value.paused + vmsStatuses.value.halted,
    accent: 'info',
    tooltip: t('vms-status.inactive.tooltip'),
  },
  {
    label: t('vms-status.unknown'),
    value: 0,
    accent: 'muted',
    tooltip: t('vms-status.unknown.tooltip'),
  },
])

// CPU provisioning
const cpuProvisioning = computed(() => {
  const totalHostCpus = host.cpus.cores
  const totalVcpus = hostVms.value.reduce((acc, vm) => acc + (vm.CPUs?.number ?? 0), 0)

  return {
    total: totalHostCpus,
    used: totalVcpus,
    percent: totalHostCpus > 0 ? Math.round((totalVcpus / totalHostCpus) * 100) : 0,
  }
})

// RAM usage
const ramUsage = computed(() => {
  const total = host.memory.size
  const used = host.memory.usage

  return {
    total: formatSizeRaw(total, 0),
    used: formatSizeRaw(used, 0),
    free: formatSizeRaw(total - used, 0),
    percent: Math.round((used / total) * 100),
  }
})
</script>
