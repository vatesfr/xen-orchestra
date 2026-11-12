<template>
  <slot :main-action="editAction" :more-actions />
</template>

<script lang="ts" setup>
import type { V2vNewMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vVmUpdate } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vNewVmActions, type V2vVmActionList } from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import type { XoV2vVm } from '@vates/types'

const { vm, updateVm } = defineProps<{
  vm: V2vNewMappingStepVm
  updateVm: V2vVmUpdate
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
}>()

defineSlots<{
  default(props: V2vVmActionList): any
}>()

const { editAction, moreActions } = useV2vNewVmActions(() => vm, { updateVm, remove: id => emit('remove', id) })
</script>
