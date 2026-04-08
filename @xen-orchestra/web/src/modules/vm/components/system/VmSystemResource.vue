<template>
  <UiCard>
    <UiTitle>
      {{ t('resource-management') }}
    </UiTitle>
    <VtsQuickInfoColumn>
      <VtsQuickInfoRow v-for="{ label, value } of resources" :key="label" :label :value />
    </VtsQuickInfoColumn>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: FrontXoVm }>()
const { t } = useI18n()

const staticMinMemoryFormatted = computed(() => formatSizeRaw(vm.memory.static[0], 0))
const staticMaxMemoryFormatted = computed(() => formatSizeRaw(vm.memory.static[1], 0))
const dynamicMinMemoryFormatted = computed(() => formatSizeRaw(vm.memory.dynamic[0], 0))
const dynamicMaxMemoryFormatted = computed(() => formatSizeRaw(vm.memory.dynamic[1], 0))

const resources = computed(() => {
  return [
    {
      label: t('cpu-cap'),
      value: vm.cpuCap ? String(vm.cpuCap) : '',
    },
    {
      label: t('cpu-mask'),
      value: vm.cpuMask?.join(', '),
    },
    {
      label: t('cpu-weight'),
      value: vm.cpuWeight ? String(vm.cpuWeight) : '',
    },
    {
      label: t('minimum-cpu-limit'),
      value: t('n-cpus', vm.CPUs.number),
    },
    {
      label: t('maximum-cpu-limit'),
      value: t('n-cpus', vm.CPUs.max),
    },
    {
      label: t('vm-limit-topology'),
      value: vm.coresPerSocket
        ? t('sockets-with-cores-per-socket', {
            nSockets: vm.CPUs.max / vm.coresPerSocket,
            nCores: vm.coresPerSocket,
          })
        : t('default-behavior'),
    },
    {
      label: t('minimum-static-memory'),
      value: `${staticMinMemoryFormatted.value.value} ${staticMinMemoryFormatted.value.prefix}`,
    },
    {
      label: t('maximum-static-memory'),
      value: `${staticMaxMemoryFormatted.value.value} ${staticMaxMemoryFormatted.value.prefix}`,
    },
    {
      label: t('minimum-dynamic-memory'),
      value: `${dynamicMinMemoryFormatted.value.value} ${dynamicMinMemoryFormatted.value.prefix}`,
    },
    {
      label: t('maximum-dynamic-memory'),
      value: `${dynamicMaxMemoryFormatted.value.value} ${dynamicMaxMemoryFormatted.value.prefix}`,
    },
    {
      label: t('gpus'),
      value: vm.VGPUs.length > 0 ? vm.VGPUs.join(', ') : t('none'),
    },
  ]
})
</script>
