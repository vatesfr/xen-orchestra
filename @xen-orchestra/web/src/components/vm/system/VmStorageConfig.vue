<template>
  <UiCard class="vm-storage-config">
    <UiTitle>
      {{ $t('storage-configuration') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('suspend-Storage-Repository')" :value="vm.suspendSr" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

defineProps<{ vm: XoVm }>()
</script>
