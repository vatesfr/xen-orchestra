<template>
  <VdiDetachButton v-if="vbd" :vbd />
  <VdiDeleteButton :vdi />
</template>

<script lang="ts" setup>
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/VdiDeleteButton.vue'
import VdiDetachButton from '@/modules/vdi/components/actions/VdiDetachButton.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'

defineProps<{
  vdi: FrontXoVdi
  vbd?: FrontXoVbd
}>()
</script>
