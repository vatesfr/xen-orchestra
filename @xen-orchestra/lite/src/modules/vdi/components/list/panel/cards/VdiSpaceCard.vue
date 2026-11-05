<template>
  <VtsSpaceCard :used="vdi.physical_utilisation" :total="vdi.virtual_size" :label="vdi.name_label" />
</template>

<script setup lang="ts">
import type { XenApiVdi } from '@/libs/xen-api/xen-api.types.ts'
import VtsSpaceCard from '@core/components/space-card/VtsSpaceCard.vue'

defineProps<{
  vdi: XenApiVdi
}>()
</script>
