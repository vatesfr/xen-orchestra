<template>
  <VdiMigrateButton :vdi />
  <VdiImportExportMenu :vdi />
  <VbdDeleteButton v-if="vbd && vm" :vbd :vm />
  <VdiDeleteButton :vdi :vm />
</template>

<script lang="ts" setup>
import VbdDeleteButton from '@/modules/vbd/components/actions/delete/VbdDeleteButton.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import VdiImportExportMenu from '@/modules/vdi/components/actions/import-export/VdiImportExportMenu.vue'
import VdiMigrateButton from '@/modules/vdi/components/actions/migrate/VdiMigrateButton.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

defineProps<{
  vm?: FrontXoVm
  vdi: FrontXoVdi
  vbd?: FrontXoVbd
}>()
</script>
