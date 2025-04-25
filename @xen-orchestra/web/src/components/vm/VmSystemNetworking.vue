<template>
  <UiCard class="vm-system-networking">
    <UiTitle>
      {{ $t('Networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('nic-type')">
      <template #value>
        {{ vm?.nicType }}
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
.vm-system-networking {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;
}
</style>
