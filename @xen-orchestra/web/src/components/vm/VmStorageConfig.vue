<template>
  <UiPanel class="vm-storage-config">
    <UiTitle>
      {{ $t('Storage-configuration') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('Suspend-Storage-Repository')">
      <template #value>
        {{ vm?.suspendSr }}
      </template>
    </VtsQuickInfoRow>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XoVm }>()
</script>

<style lang="postcss" scoped>
.vm-storage-config {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;
}
</style>
