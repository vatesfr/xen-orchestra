<template>
  <slot :main-action="editAction" :more-actions />
</template>

<script lang="ts" setup>
import { useV2vResumedVmActions } from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'
import type { V2vResumedMappingStepVm } from '@/modules/v2v/types/v2v-mapping-step.type.ts'
import type { V2vVmActionList } from '@/modules/v2v/types/v2v-vm-actions.type.ts'

const { vm } = defineProps<{
  vm: V2vResumedMappingStepVm
}>()

defineSlots<{
  default(props: V2vVmActionList): any
}>()

const { editAction, moreActions } = useV2vResumedVmActions(() => vm)
</script>
