<template>
  <UiCard class="vm-system-networking">
    <UiTitle>
      {{ $t('Networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('nic-type')" :value="vm?.nicType" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XoVm }>()
</script>
