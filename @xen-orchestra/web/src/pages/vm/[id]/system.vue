<template>
  <div class="system">
    <div class="colum1">
      <UiCard><VmGeneralInfo :vm /></UiCard>
      <UiCard><VmSystemNetworking :vm /></UiCard>
      <UiCard><VmStorageConfig :vm /></UiCard>
      <UiCard><VmResource :vm /></UiCard>
    </div>
    <div class="colum2">
      <UiCard><VmVirtualisationAndBoot :vm /></UiCard>
      <UiCard><VmManagment :vm /></UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import VmGeneralInfo from '@/components/vm/VmGeneralInfo.vue'
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
  div {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
