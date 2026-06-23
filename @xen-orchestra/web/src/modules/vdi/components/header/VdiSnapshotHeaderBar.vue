<template>
  <UiHeadBar>
    {{ vdiSnapshot.name_label }}
    <template #icon>
      <VtsIcon size="medium" name="object:vdi-snapshot" />
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

defineProps<{
  vdiSnapshot: FrontXoVdiSnapshot
}>()
</script>
