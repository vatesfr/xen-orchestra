<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <VifGeneralInfoCard :vif />
    </VtsColumn>
    <VtsColumn>
      <VifNetworkInfoCard :vif />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import VifGeneralInfoCard from '@/modules/vif/components/cards/VifGeneralInfoCard.vue'
import VifNetworkInfoCard from '@/modules/vif/components/cards/VifNetworkInfoCard.vue'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{ vif: XenApiVif }>()
</script>
