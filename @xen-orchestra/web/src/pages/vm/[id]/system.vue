<template>
  <div class="system">
    <div class="colum">
      <UiCard><VmGeneralInfo :vm /></UiCard>
      <UiCard><VmSystemNetworking :vm /></UiCard>
      <UiCard><VmStorageConfig :vm /></UiCard>
      <UiCard><VmResource :vm /></UiCard>
    </div>
    <div class="colum">
      <UiCard><VmVirtualisationAndBoot :vm /></UiCard>
      <UiCard><VmManagment :vm /></UiCard>
      <UiCard><VmGraphics :vm /></UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import VmGeneralInfo from '@/components/vm/VmGeneralInfo.vue'
import VmGraphics from '@/components/vm/VmGraphics.vue'
import VmManagment from '@/components/vm/VmManagment.vue'
import VmResource from '@/components/vm/VmResource.vue'
import VmStorageConfig from '@/components/vm/VmStorageConfig.vue'
import VmSystemNetworking from '@/components/vm/VmSystemNetworking.vue'
import VmVirtualisationAndBoot from '@/components/vm/VmVirtualisationAndBoot.vue'
import type { XoVm } from '@/types/xo/vm.type'
import UiCard from '@core/components/ui/card/UiCard.vue'

const { vm } = defineProps<{ vm: XoVm }>()
</script>

<style scoped lang="postcss">
.system {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  width: 100%;
  .colum {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 50%;
  }
}
</style>
