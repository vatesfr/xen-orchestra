<template>
  <UiCard>
    <UiTitle>
      {{ t('resource-management') }}
    </UiTitle>
    <VtsQuickInfoRow v-for="{ label, value } of resources" :key="label" :label :value />
  </UiCard>
</template>

<script setup lang="ts">
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XoVm }>()
const { t } = useI18n()

const staticMinMemoryFormated = computed(() => formatSizeRaw(vm.memory.static[0], 0))
const staticMaxMemoryFormated = computed(() => formatSizeRaw(vm.memory.static[1], 0))
const dynamicMinMemoryFormated = computed(() => formatSizeRaw(vm.memory.dynamic[0], 0))
const dynamicMaxMemoryFormated = computed(() => formatSizeRaw(vm.memory.dynamic[1], 0))

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
      value: `${staticMinMemoryFormated.value.value} ${staticMinMemoryFormated.value.prefix}`,
    },
    {
      label: t('maximum-static-memory'),
      value: `${staticMaxMemoryFormated.value.value} ${staticMaxMemoryFormated.value.prefix}`,
    },
    {
      label: t('minimum-dynamic-memory'),
      value: `${dynamicMinMemoryFormated.value.value} ${dynamicMinMemoryFormated.value.prefix}`,
    },
    {
      label: t('maximum-dynamic-memory'),
      value: `${dynamicMaxMemoryFormated.value.value} ${dynamicMaxMemoryFormated.value.prefix}`,
    },
    {
      label: t('gpus'),
      value: vm.VGPUs.length > 0 ? vm.VGPUs.join(', ') : t('none'),
    },
  ]
})
</script>
