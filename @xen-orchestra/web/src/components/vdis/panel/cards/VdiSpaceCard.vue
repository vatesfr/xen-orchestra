<template>
  <VtsSpaceCard :used="vdi.usage" :total="vdi.size" :label="vdi.name_label" />
</template>

<script setup lang="ts">
import VtsSpaceCard from '@core/components/space-card/VtsSpaceCard.vue'
import type { XoVdi } from '@vates/types'

defineProps<{
  vdi: XoVdi
}>()
</script>
