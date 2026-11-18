<template>
  <slot :main-action="editAction" :more-actions />
</template>

<script lang="ts" setup>
import {
  useV2vNewVmActions,
  useV2vNotFoundVmActions,
  useV2vResumedVmActions,
} from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import type {
  V2vMappingStepVm,
  V2vNewMappingStepVm,
  V2vNotFoundMappingStepVm,
  V2vResumedMappingStepVm,
} from '@/modules/v2v/types/v2v-mapping-step.type.ts'
import type { V2vVmUpdate } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vVmActionList, V2vVmKindActionRefs } from '@/modules/v2v/types/v2v-vm-actions.type.ts'
import type { XoV2vVm } from '@vates/types'

// The actions of the kind of the VM, for the caller to lay out: the side panel header and a table row menu read the
// same ones. The composable of the kind is chosen once, at setup: the caller keys this component by the kind of its
// VM, which changes once the import VM of a resumed VM is deleted. The key keeps each getter on its kind
const { vm, updateVm } = defineProps<{
  vm: V2vMappingStepVm
  // A function, not an emit: a row menu unmounts this component once it closes, before the settings drawer confirms
  updateVm: V2vVmUpdate
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
}>()

defineSlots<{
  default(props: V2vVmActionList): any
}>()

function useKindActions(): V2vVmKindActionRefs {
  const remove = (id: XoV2vVm['id']) => emit('remove', id)

  switch (vm.kind) {
    case 'new':
      return useV2vNewVmActions(() => vm as V2vNewMappingStepVm, { updateVm, remove })
    case 'resume':
      return useV2vResumedVmActions(() => vm as V2vResumedMappingStepVm)
    case 'not-found':
      return useV2vNotFoundVmActions(() => vm as V2vNotFoundMappingStepVm, { remove })
  }
}

const { editAction, moreActions } = useKindActions()
</script>
