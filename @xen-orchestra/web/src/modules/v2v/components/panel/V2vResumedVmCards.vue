<template>
  <V2vDestinationVmCard :vm="destinationVm" :pool-name />
  <V2vNextRunCard :last-sync-at="vm.lastSyncAt" />
  <V2vActiveMappingCard
    :pool-name
    :disk-rows="activeDiskRows"
    :nic-rows="activeNicRows"
    :loading="!isActiveMappingReady"
  />
</template>

<script lang="ts" setup>
import V2vActiveMappingCard from '@/modules/v2v/components/mapping/V2vActiveMappingCard.vue'
import V2vDestinationVmCard from '@/modules/v2v/components/mapping/V2vDestinationVmCard.vue'
import V2vNextRunCard from '@/modules/v2v/components/mapping/V2vNextRunCard.vue'
import { useV2vResumedVm } from '@/modules/v2v/composables/use-v2v-resumed-vm.composable.ts'
import type { V2vResumedMappingStepVm } from '@/modules/v2v/types/v2v-mapping-step.type.ts'

const { vm } = defineProps<{
  vm: V2vResumedMappingStepVm
}>()

const { poolName, destinationVm, activeDiskRows, activeNicRows, isActiveMappingReady } = useV2vResumedVm(
  () => vm.vm,
  () => vm.importVm
)
</script>
