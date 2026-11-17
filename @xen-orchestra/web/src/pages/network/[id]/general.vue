<template>
  <VtsColumns :columns="1" extra-space-around>
    <VtsColumn>
      <NetworkGeneralInfoCard :network />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import NetworkGeneralInfoCard from '@/modules/network/components/cards/NetworkGeneralInfoCard.vue'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{ network: FrontXoNetwork }>()
</script>
