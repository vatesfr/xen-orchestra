<template>
  <UiCard class="vm-resource">
    <UiTitle>
      {{ $t('resource-management') }}
    </UiTitle>
    <template v-for="(value, key) in generalInfo" :key>
      <VtsQuickInfoRow :label="$t(key)" :value="value" />
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XenApiVm | undefined }>()

const { getByOpaqueRef: getMetricsByOpaqueRef } = useVmMetricsStore().subscribe()

type GeneralInfo = {
  'cpu-mask': string
  'CPU-weight': string
  'cpu-cap': string
  'minimum-CPU-limit': string
  'maximum-CPU-limit': string
  'vm-limit-topology': string
  'minimum-static-memory': string
  'maximum-static-memory': string
  'minimum-dynamic-memory': string
  'maximum-dynamic-memory': string
  GPUs: string
}

const { t } = useI18n()

const staticMinMemoryFormated = formatSizeRaw(vm?.memory_static_min, 0)
const staticMaxMemoryFormated = formatSizeRaw(vm?.memory_static_max, 0)
const dynamicMinMemoryFormated = formatSizeRaw(vm?.memory_dynamic_min, 0)
const dynamicMaxMemoryFormated = formatSizeRaw(vm?.memory_dynamic_max, 0)

// @see packages/xo-server/src/xapi-object-to-xo.mjs
const { major, minor } = (vm?.guest_metrics as any | undefined)?.PV_drivers_version ?? {}
const xenTools = !(
  !vm?.power_state ||
  !vm?.metrics ||
  vm?.guest_metrics === undefined ||
  major === undefined ||
  minor === undefined
)
const VmMetrics = vm?.metrics ? getMetricsByOpaqueRef(vm?.metrics) : undefined
const maxCPU =
  vm && vm.power_state && vm.metrics && xenTools && VmMetrics ? VmMetrics.VCPUs_number : +(vm?.VCPUs_at_startup ?? 0)

const generalInfo: GeneralInfo = {
  'cpu-cap': vm?.VCPUs_params.cap ? String(+vm?.VCPUs_params.cap) : '0' /* XEN_DEFAULT_CPU_CAP */,
  'cpu-mask': vm?.VCPUs_params.mask
    ? vm?.VCPUs_params.mask
        .split(',')
        .map(toPositive => +toPositive)
        .join(', ')
    : '',
  'CPU-weight': vm?.VCPUs_params.weight ? String(+vm?.VCPUs_params.weight) : '256' /* XEN_DEFAULT_CPU_WEIGHT */,
  'minimum-CPU-limit': 'no data',
  'maximum-CPU-limit': `${maxCPU} ${t('CPUs')}`,
  'vm-limit-topology': vm?.platform['cores-per-socket']
    ? t('sockets-with-cores-per-socket', {
        nSockets: maxCPU / Number(vm?.platform['cores-per-socket'] ?? 0),
        nCores: vm?.platform['cores-per-socket'] ?? 0,
      })
    : '',
  'minimum-static-memory': `${staticMinMemoryFormated?.value} ${staticMinMemoryFormated?.prefix}`,
  'maximum-static-memory': `${staticMaxMemoryFormated?.value} ${staticMaxMemoryFormated?.prefix}`,
  'minimum-dynamic-memory': `${dynamicMinMemoryFormated?.value} ${dynamicMinMemoryFormated?.prefix}`,
  'maximum-dynamic-memory': `${dynamicMaxMemoryFormated?.value} ${dynamicMaxMemoryFormated?.prefix}`,
  GPUs: vm?.VGPUs.join(', ') ?? '',
}
</script>

<!-- cpu-* -->
