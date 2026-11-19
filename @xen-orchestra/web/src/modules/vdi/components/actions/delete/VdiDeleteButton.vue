<template>
  <VtsDeleteButton
    :hint="deleteVdisErrorMessage"
    :disabled="!canDeleteVdis"
    :busy="isDeletingVdis"
    @click="deleteVdis()"
  />
</template>

<script lang="ts" setup>
import { useVdiDelete } from '@/modules/vdi/composables/use-vdi-delete.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'

const { vdi, vm } = defineProps<{
  vdi: FrontXoVdi
  vm?: FrontXoVm
}>()

const { deleteVdis, canDeleteVdis, isDeletingVdis, deleteVdisErrorMessage } = useVdiDelete({
  vdis: () => [vdi],
  vm: () => vm,
})
</script>
