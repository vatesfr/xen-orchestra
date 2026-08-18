<template>
  <VtsSidePanel :has-selection="!!vdi" @close="emit('close')">
    <template v-if="vdi" #default>
      <VdiInfoCard :vdi :vbd />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi :vbd />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VdiConfigurationCard from '@/components/vm/vdis/panel/VdiConfigurationCard.vue'
import VdiInfoCard from '@/components/vm/vdis/panel/VdiInfoCard.vue'
import VdiSpaceCard from '@/components/vm/vdis/panel/VdiSpaceCard.vue'
import type { XenApiVdi, XenApiVbd } from '@/libs/xen-api/xen-api.types.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { vdi, vbd } = defineProps<{
  vdi?: XenApiVdi
  vbd?: XenApiVbd
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
