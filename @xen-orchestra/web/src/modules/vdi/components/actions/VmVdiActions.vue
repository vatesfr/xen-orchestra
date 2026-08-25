<template>
  <VbdConnectionToggleButton v-if="vbd" :vbd :vm />
  <VdiMigrateButton :vdi />
  <VdiImportExportMenu :vdi />
  <VbdDeleteButton v-if="vbd" :vbd :vm />
  <VdiDeleteButton :vdi :vm />
</template>

<script lang="ts" setup>
import VbdConnectionToggleButton from '@/modules/vbd/components/actions/connection/VbdConnectionToggleButton.vue'
import VbdDeleteButton from '@/modules/vbd/components/actions/delete/VbdDeleteButton.vue'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import VdiImportExportMenu from '@/modules/vdi/components/actions/import-export/VdiImportExportMenu.vue'
import VdiMigrateButton from '@/modules/vdi/components/actions/migrate/VdiMigrateButton.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed } from 'vue'

const { vm, vdi } = defineProps<{
  vm: FrontXoVm
  vdi: FrontXoVdi
}>()

const { useGetVbdsByIds } = useXoVbdCollection()

const vbds = useGetVbdsByIds(() => vdi.$VBDs)

const vbd = computed(() => vbds.value.find(vbd => vbd.VM === vm.id))
</script>
