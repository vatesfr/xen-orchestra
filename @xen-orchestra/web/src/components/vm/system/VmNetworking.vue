<template>
  <UiCard class="vm-networking">
    <UiTitle>
      {{ $t('networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('nic-type')" :value="vm.nicType" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

defineProps<{ vm: XoVm }>()
</script>
