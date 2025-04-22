<!-- vtsQuickInfoRow n'a pas les bonne couleur. proposition de généré depuis un objet -->
<template>
  <UiPanel>
    <UiTitle>
      {{ $t('general-information') }}
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
  name: string
  id: string
  description: string
  tags: Array<string>
  'os-name': string
  'os-kernel': string
  'Management-agent-version': string
}

const { vm } = defineProps<{ vm: XoVm }>()

const generalInfo: GeneralInfo = {
  name: vm.name_label,
  id: vm.id,
  description: vm.name_description,
  tags: vm.tags,
  'os-name': vm.os_version.name,
  'os-kernel': vm.os_version.distro,
  'Management-agent-version': '-',
}
</script>
