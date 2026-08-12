<template>
  <VdiMigrateButton :vdi />
  <VdiImportExportMenu :vdi />
  <VdiDeleteButton :vdi />
</template>

<script lang="ts" setup>
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import VdiImportExportMenu from '@/modules/vdi/components/actions/import-export/VdiImportExportMenu.vue'
import VdiMigrateButton from '@/modules/vdi/components/actions/migrate/VdiMigrateButton.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'

defineProps<{
  vdi: FrontXoVdi
}>()
</script>
