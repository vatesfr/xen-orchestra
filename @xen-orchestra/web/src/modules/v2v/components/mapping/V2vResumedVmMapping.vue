<template>
  <div class="v2v-resumed-vm-mapping">
    <V2vMappingVmHeader :heading action="delete" :busy="isDeletingVm" @delete="deleteVm()" />
    <div class="content">
      <div class="cards">
        <V2vDestinationVmCard :vm="destinationVm" :pool-name />
        <V2vNextRunCard :transfer="nextTransfer" :last-sync-at />
      </div>
      <V2vActiveMappingCard :pool-name :rows="activeMappingRows" :loading="!isActiveMappingReady" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import V2vActiveMappingCard from '@/modules/v2v/components/mapping/V2vActiveMappingCard.vue'
import V2vDestinationVmCard from '@/modules/v2v/components/mapping/V2vDestinationVmCard.vue'
import V2vMappingVmHeader from '@/modules/v2v/components/mapping/V2vMappingVmHeader.vue'
import V2vNextRunCard from '@/modules/v2v/components/mapping/V2vNextRunCard.vue'
import type { V2vMappingVmHeading } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import { useV2vResumedVm } from '@/modules/v2v/composables/use-v2v-resumed-vm.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoV2vVm } from '@vates/types'

const { vm, importVm } = defineProps<{
  heading: V2vMappingVmHeading
  vm: XoV2vVm
  importVm: FrontXoVm
  lastSyncAt?: number
}>()

const { poolName, destinationVm, activeMappingRows, isActiveMappingReady, nextTransfer, deleteVm, isDeletingVm } =
  useV2vResumedVm(
    () => vm,
    () => importVm
  )
</script>

<style lang="postcss" scoped>
.v2v-resumed-vm-mapping {
  display: flex;
  flex-direction: column;

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    padding: 1.6rem;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(38rem, 100%), 1fr));
    align-items: start;
    gap: 1.6rem;
  }
}
</style>
