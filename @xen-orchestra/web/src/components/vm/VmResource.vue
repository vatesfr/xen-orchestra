<!-- vtsQuickInfoRow n'a pas les bonne couleur. proposition de généré depuis un objet -->
<template>
  <UiPanel>
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
  </UiPanel>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

type GeneralInfo = {
  'CPU-mask': string
  'CPU-weight': string
  'CPU-cap': string
  'Minimum-CPU-limit': string
  'Maximum-CPU-limit': string
  'Vm-limit-topologie': string
  'Minimum-static-memory': string
  'Maximum-static-memory': string
  'Minimum-dynamic-memory': string
  'Maximum-dynamic-memory': string
  GPUs: Array<string>
}

const { vm } = defineProps<{ vm: XoVm }>()
const { t } = useI18n()
// on lite we have FromByteSize, should we take it back? ?
const generalInfo: GeneralInfo = {
  'CPU-mask': 'no data',
  'CPU-weight': 'no data',
  'CPU-cap': 'no data',
  'Minimum-CPU-limit': 'no data',
  'Maximum-CPU-limit': vm.CPUs.max + ' ' + t('CPUs'),
  'Vm-limit-topologie': 'no data',
  'Minimum-static-memory': vm.memory.static[0] / 1_073_741_824 /* (1024 ** 3) */ + ' ' + t('bytes.gi'),
  'Maximum-static-memory': vm.memory.static[1] / 1_073_741_824 /* (1024 ** 3) */ + ' ' + t('bytes.gi'),
  'Minimum-dynamic-memory': vm.memory.dynamic[0] / 1_073_741_824 /* (1024 ** 3) */ + ' ' + t('bytes.gi'),
  'Maximum-dynamic-memory': vm.memory.dynamic[1] / 1_073_741_824 /* (1024 ** 3) */ + ' ' + t('bytes.gi'),
  GPUs: vm.VGPUs,
}
</script>
