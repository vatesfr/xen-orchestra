<template>
  <V2vVmKindActions v-slot="{ mainAction, moreActions }" :vm :update-vm @remove="id => emit('remove', id)">
    <VtsActionItems :actions="getV2vVmMenuActions(mainAction, moreActions)" />
  </V2vVmKindActions>
</template>

<script lang="ts" setup>
import V2vVmKindActions from '@/modules/v2v/components/panel/V2vVmKindActions.vue'
import type { V2vMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vVmUpdate } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { getV2vVmMenuActions } from '@/modules/v2v/utils/v2v-vm-actions.util.ts'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'
import type { XoV2vVm } from '@vates/types'

defineProps<{
  vm: V2vMappingStepVm
  updateVm: V2vVmUpdate
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
}>()
</script>
