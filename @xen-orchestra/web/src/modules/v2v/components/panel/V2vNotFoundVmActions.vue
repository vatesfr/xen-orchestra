<template>
  <slot :more-actions />
</template>

<script lang="ts" setup>
import { useV2vNotFoundVmActions } from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import type { V2vNotFoundMappingStepVm } from '@/modules/v2v/types/v2v-mapping-step.type.ts'
import type { V2vVmActionList } from '@/modules/v2v/types/v2v-vm-actions.type.ts'
import type { XoV2vVm } from '@vates/types'

const { vm } = defineProps<{
  vm: V2vNotFoundMappingStepVm
}>()

const emit = defineEmits<{
  remove: [id: XoV2vVm['id']]
}>()

defineSlots<{
  default(props: V2vVmActionList): any
}>()

const { moreActions } = useV2vNotFoundVmActions(() => vm, { remove: id => emit('remove', id) })
</script>
