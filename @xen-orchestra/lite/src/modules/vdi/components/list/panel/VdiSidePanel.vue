<template>
  <VtsSidePanel :has-selection="!!vdi" @close="emit('close')">
    <template v-if="vdi" #default>
      <VdiInfosCard :vdi :vbd />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi :vbd />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import type { XenApiVbd, XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
defineProps<{
  vdi?: XenApiVdi
  vbd?: XenApiVbd
}>()
const emit = defineEmits<{
  close: []
}>()
</script>
