<template>
  <UiCard class="vm-storage-config">
    <UiTitle>
      {{ $t('Storage-configuration') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('Suspend-Storage-Repository')">
      <template #value>
        {{ vm?.suspendSr }}
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XoVm }>()
</script>

<style lang="postcss" scoped>
.vm-storage-config {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;
}
</style>
