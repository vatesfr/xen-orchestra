<template>
  <UiCard class="vm-system-networking">
    <UiTitle>
      {{ $t('Networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('nic-type')" :value="vm?.platform.nic_type" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XenApiVm | undefined }>()
</script>
