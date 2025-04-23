<!-- vtsQuickInfoRow n'a pas les bonne couleur. proposition de généré depuis un objet -->
<template>
  <UiPanel class="vm-system-networking">
    <UiTitle>
      {{ $t('Networking') }}
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

type GeneralInfo = {
  'nic-type': string
}

const { vm } = defineProps<{ vm: XoVm }>()

const generalInfo: GeneralInfo = {
  'nic-type': vm?._xapiRef ?? '-',
}
</script>
