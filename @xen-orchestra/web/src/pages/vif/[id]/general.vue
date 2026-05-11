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
import VifGeneralInfoCard from '@/modules/vif/components/cards/VifGeneralInfoCard.vue'
import VifNetworkInfoCard from '@/modules/vif/components/cards/VifNetworkInfoCard.vue'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{ vif: FrontXoVif }>()
</script>
