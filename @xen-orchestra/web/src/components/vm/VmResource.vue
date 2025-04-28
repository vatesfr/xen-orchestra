<template>
  <UiCard class="vm-resource">
    <UiTitle>
      {{ $t('resource-management') }}
    </UiTitle>
    <template v-for="(value, key) in generalInfo" :key>
      <VtsQuickInfoRow :label="$t(key)" :value="String(value)" />
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { useI18n } from 'vue-i18n'

type GeneralInfo = {
  'cpu-mask': string
  'CPU-weight': number
  'cpu-cap': number
  'minimum-CPU-limit': string
  'maximum-CPU-limit': string
  'vm-limit-topology': string
  'minimum-static-memory': string
  'maximum-static-memory': string
  'minimum-dynamic-memory': string
  'maximum-dynamic-memory': string
  GPUs: string
}

const { vm } = defineProps<{ vm: XoVm }>()
const { t } = useI18n()

const staticMinMemoryFormated = formatSizeRaw(vm.memory.static[0], 0)
const staticMaxMemoryFormated = formatSizeRaw(vm.memory.static[1], 0)
const dynamicMinMemoryFormated = formatSizeRaw(vm.memory.dynamic[0], 0)
const dynamicMaxMemoryFormated = formatSizeRaw(vm.memory.dynamic[1], 0)

const generalInfo: GeneralInfo = {
  'cpu-cap': vm.cpuCap ? vm.cpuCap : 0 /* XEN_DEFAULT_CPU_CAP */,
  'cpu-mask': vm.cpuMask ? vm.cpuMask.join(', ') : '',
  'CPU-weight': vm.cpuWeight ? vm.cpuWeight : 256 /* XEN_DEFAULT_CPU_WEIGHT */,
  'minimum-CPU-limit': 'no data',
  'maximum-CPU-limit': vm.CPUs.max + ' ' + t('CPUs'),
  'vm-limit-topology': vm.coresPerSocket
    ? t('sockets-with-cores-per-socket', {
        nSockets: vm.CPUs.max / vm.coresPerSocket,
        nCores: vm.coresPerSocket,
      })
    : '',
  'minimum-static-memory': `${staticMinMemoryFormated?.value} ${staticMinMemoryFormated?.prefix}`,
  'maximum-static-memory': `${staticMaxMemoryFormated?.value} ${staticMaxMemoryFormated?.prefix}`,
  'minimum-dynamic-memory': `${dynamicMinMemoryFormated?.value} ${dynamicMinMemoryFormated?.prefix}`,
  'maximum-dynamic-memory': `${dynamicMaxMemoryFormated?.value} ${dynamicMaxMemoryFormated?.prefix}`,
  GPUs: vm.VGPUs.join(', '),
}
</script>
