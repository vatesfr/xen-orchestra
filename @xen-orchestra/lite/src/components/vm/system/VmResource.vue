<template>
  <UiCard>
    <UiTitle>
      {{ t('resource-management') }}
    </UiTitle>
    <VtsQuickInfoRow v-for="{ label, value } of resources" :key="label" :label :value />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import { useVmMetricsStore } from '@/stores/xen-api/vm-metrics.store'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XenApiVm }>()

const { getByOpaqueRef: getMetricsByOpaqueRef } = useVmMetricsStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()

const { t } = useI18n()

const staticMinMemoryFormated = computed(() => formatSizeRaw(vm.memory_static_min, 0))
const staticMaxMemoryFormated = computed(() => formatSizeRaw(vm.memory_static_max, 0))
const dynamicMinMemoryFormated = computed(() => formatSizeRaw(vm.memory_dynamic_min, 0))
const dynamicMaxMemoryFormated = computed(() => formatSizeRaw(vm.memory_dynamic_max, 0))
const vmGuestMetrics = computed(() => getGuestMetricsByOpaqueRef(vm.guest_metrics))
const vmMetrics = computed(() => getMetricsByOpaqueRef(vm.metrics))

// @see packages/xo-server/src/xapi-object-to-xo.mjs

const hasXenTools = computed(() => {
  if (vmGuestMetrics.value === undefined) {
    return false
  }

  return (
    vmGuestMetrics.value.PV_drivers_version?.major !== undefined &&
    vmGuestMetrics.value.PV_drivers_version?.minor !== undefined
  )
})

const maxCpu = computed(() =>
  hasXenTools.value && vmMetrics.value ? vmMetrics.value.VCPUs_number : (vm.VCPUs_at_startup ?? 0)
)

const minimumCpuLimitText = computed(
  () => `${hasXenTools.value && vmMetrics.value ? vmMetrics.value.VCPUs_number : vm.VCPUs_at_startup} ${t('cpus')}`
)
const resources = computed(() => {
  return [
    {
      label: t('cpu-cap'),
      value: vm.VCPUs_params.cap,
    },
    {
      label: t('cpu-mask'),
      value: vm.VCPUs_params.mask?.replace(',', ', '),
    },
    {
      label: t('cpu-weight'),
      value: vm.VCPUs_params.weight,
    },
    {
      label: t('minimum-cpu-limit'),
      value: minimumCpuLimitText.value,
    },
    {
      label: t('maximum-cpu-limit'),
      value: `${vm.VCPUs_max} ${t('cpus')}`,
    },
    {
      label: t('vm-limit-topology'),
      value: vm.platform['cores-per-socket']
        ? t('sockets-with-cores-per-socket', {
            nSockets: vm.platform['cores-per-socket'] ? maxCpu.value / Number(vm.platform['cores-per-socket']) : 0,
            nCores: vm.platform['cores-per-socket'] ?? 0,
          })
        : t('default-behavior'),
    },
    {
      label: t('minimum-static-memory'),
      value: `${staticMinMemoryFormated.value?.value} ${staticMinMemoryFormated.value?.prefix}`,
    },
    {
      label: t('maximum-static-memory'),
      value: `${staticMaxMemoryFormated.value?.value} ${staticMaxMemoryFormated.value?.prefix}`,
    },
    {
      label: t('minimum-dynamic-memory'),
      value: `${dynamicMinMemoryFormated.value?.value} ${dynamicMinMemoryFormated.value?.prefix}`,
    },
    {
      label: t('maximum-dynamic-memory'),
      value: `${dynamicMaxMemoryFormated.value?.value} ${dynamicMaxMemoryFormated.value?.prefix}`,
    },
    {
      label: t('gpus'),
      value: vm.VGPUs.length > 0 ? vm.VGPUs.join(', ') : t('none'),
    },
  ]
})
</script>
