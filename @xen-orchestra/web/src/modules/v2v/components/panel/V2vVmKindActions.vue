<template>
  <V2vNewVmActions v-if="vm.kind === 'new'" v-slot="actions" :vm :update-vm @remove="id => emit('remove', id)">
    <slot v-bind="actions" />
  </V2vNewVmActions>
  <V2vResumedVmActions v-else-if="vm.kind === 'resume'" v-slot="actions" :vm>
    <slot v-bind="actions" />
  </V2vResumedVmActions>
  <V2vNotFoundVmActions v-else v-slot="actions" :vm @remove="id => emit('remove', id)">
    <slot v-bind="actions" />
  </V2vNotFoundVmActions>
</template>

<script lang="ts" setup>
import V2vNewVmActions from '@/modules/v2v/components/panel/V2vNewVmActions.vue'
import V2vNotFoundVmActions from '@/modules/v2v/components/panel/V2vNotFoundVmActions.vue'
import V2vResumedVmActions from '@/modules/v2v/components/panel/V2vResumedVmActions.vue'
import type { V2vMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vVmActionList } from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import type { V2vVmMappingContext } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import type { XoV2vVm } from '@vates/types'

// The actions of the kind of the VM, for the caller to lay out: the side panel header and a table row menu read the
// same ones. The kind of a VM changes once the import VM of a resumed VM is deleted: its actions then switch with it
defineProps<{
  vm: V2vMappingStepVm
  updateVm: V2vVmMappingContext['updateVm']
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
}>()

defineSlots<{
  default(props: V2vVmActionList): any
}>()
</script>
