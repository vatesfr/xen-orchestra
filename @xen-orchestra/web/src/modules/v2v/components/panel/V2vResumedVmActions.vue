<template>
  <V2vVmActions :main-action="editAction" :more-actions />
</template>

<script lang="ts" setup>
import V2vVmActions from '@/modules/v2v/components/panel/V2vVmActions.vue'
import type { V2vResumedMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import { useV2vResumedVmActions } from '@/modules/v2v/composables/use-v2v-vm-actions.composable.ts'

const { vm } = defineProps<{
  vm: V2vResumedMappingStepVm
}>()

const { editAction, moreActions } = useV2vResumedVmActions(() => vm)
</script>
