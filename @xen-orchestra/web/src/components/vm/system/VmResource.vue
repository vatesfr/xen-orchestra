<template>
  <UiCard class="vm-resource">
    <UiTitle>
      {{ $t('resource-management') }}
    </UiTitle>
    <VtsQuickInfoRow v-for="{ label, value } of resources" :key="label" :label :value />
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XoVm }>()
const { t } = useI18n()

const resources = computed(() => {
  const staticMinMemoryFormated = formatSizeRaw(vm.memory.static[0], 0)
  const staticMaxMemoryFormated = formatSizeRaw(vm.memory.static[1], 0)
  const dynamicMinMemoryFormated = formatSizeRaw(vm.memory.dynamic[0], 0)
  const dynamicMaxMemoryFormated = formatSizeRaw(vm.memory.dynamic[1], 0)
  return [
    {
      label: t('cpu-cap'),
      value: String(vm.cpuCap ? vm.cpuCap : 0) /* XEN_DEFAULT_CPU_CAP */,
    },
    {
      label: t('cpu-mask'),
      value: vm.cpuMask ? vm.cpuMask.join(', ') : t('none'),
    },
    {
      label: t('cpu-weight'),
      value: String(vm.cpuWeight ? vm.cpuWeight : 256) /* XEN_DEFAULT_CPU_WEIGHT */,
    },
    {
      label: t('minimum-cpu-limit'),
      // TODO
      value: '',
    },
    {
      label: t('maximum-cpu-limit'),
      value: `${vm.CPUs.max} ${t('cpus')}`,
    },
    {
      label: t('vm-limit-topology'),
      value: vm.coresPerSocket
        ? t('sockets-with-cores-per-socket', {
            nSockets: vm.CPUs.max / vm.coresPerSocket,
            nCores: vm.coresPerSocket,
          })
        : '',
    },
    {
      label: t('minimum-static-memory'),
      value: `${staticMinMemoryFormated?.value} ${staticMinMemoryFormated?.prefix}`,
    },
    {
      label: t('maximum-static-memory'),
      value: `${staticMaxMemoryFormated?.value} ${staticMaxMemoryFormated?.prefix}`,
    },
    {
      label: t('minimum-dynamic-memory'),
      value: `${dynamicMinMemoryFormated?.value} ${dynamicMinMemoryFormated?.prefix}`,
    },
    {
      label: t('maximum-dynamic-memory'),
      value: `${dynamicMaxMemoryFormated?.value} ${dynamicMaxMemoryFormated?.prefix}`,
    },
  ]
})
</script>
