<template>
  <V2vVmActions :main-action="editAction" :more-actions />
</template>

<script lang="ts" setup>
import V2vVmActions from '@/modules/v2v/components/panel/V2vVmActions.vue'
import type { V2vNewMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import { useV2vNewVmActions } from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import type { V2vVmMappingContext } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import type { XoV2vVm } from '@vates/types'

const { vm, updateVm } = defineProps<{
  vm: V2vNewMappingStepVm
  updateVm: V2vVmMappingContext['updateVm']
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
}>()

const { editAction, moreActions } = useV2vNewVmActions(() => vm, { updateVm, remove: id => emit('remove', id) })
</script>
