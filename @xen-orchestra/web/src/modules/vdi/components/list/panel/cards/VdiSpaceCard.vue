<template>
  <VtsSpaceCard :used="vdi.usage" :total="vdi.size" :label="vdi.name_label" />
</template>

<script setup lang="ts">
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsSpaceCard from '@core/components/space-card/VtsSpaceCard.vue'

defineProps<{
  vdi: FrontXoVdi
}>()
</script>
