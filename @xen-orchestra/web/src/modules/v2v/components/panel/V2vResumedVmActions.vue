<template>
  <slot :main-action="editAction" :more-actions />
</template>

<script lang="ts" setup>
import type { V2vResumedMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import {
  useV2vResumedVmActions,
  type V2vVmActionList,
} from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'

const { vm } = defineProps<{
  vm: V2vResumedMappingStepVm
}>()

defineSlots<{
  default(props: V2vVmActionList): any
}>()

const { editAction, moreActions } = useV2vResumedVmActions(() => vm)
</script>
