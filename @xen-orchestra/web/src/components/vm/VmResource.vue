<template>
  <UiCard class="vm-resource">
    <UiTitle>
      {{ $t('resource-management') }}
    </UiTitle>
    <template v-for="(value, key) in generalInfo" :key="key">
      <VtsQuickInfoRow :label="$t(key)">
        <template #value>
          {{ value }}
        </template>
      </VtsQuickInfoRow>
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
  'Minimum-CPU-limit': string
  'Maximum-CPU-limit': string
  'vm-limit-typology': string
  'Minimum-static-memory': string
  'Maximum-static-memory': string
  'Minimum-dynamic-memory': string
  'Maximum-dynamic-memory': string
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
  'Minimum-CPU-limit': 'no data',
  'Maximum-CPU-limit': vm.CPUs.max + ' ' + t('CPUs'),
  'vm-limit-typology': vm.coresPerSocket
    ? t('vmSocketsWithCoresPerSocket', {
        nSockets: vm.CPUs.max / vm.coresPerSocket,
        nCores: vm.coresPerSocket,
      })
    : '',
  'Minimum-static-memory': `${staticMinMemoryFormated?.value} ${staticMinMemoryFormated?.prefix}`,
  'Maximum-static-memory': `${staticMaxMemoryFormated?.value} ${staticMaxMemoryFormated?.prefix}`,
  'Minimum-dynamic-memory': `${dynamicMinMemoryFormated?.value} ${dynamicMinMemoryFormated?.prefix}`,
  'Maximum-dynamic-memory': `${dynamicMaxMemoryFormated?.value} ${dynamicMaxMemoryFormated?.prefix}`,
  GPUs: vm.VGPUs.join(', '),
}
</script>

<style lang="postcss" scoped>
.vm-resource {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;
}
</style>
