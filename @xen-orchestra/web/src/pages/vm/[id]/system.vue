<template>
  <div class="system">
    <div class="column">
      <VmGeneralInfo :vm />
      <VmSystemNetworking :vm />
      <VmStorageConfig :vm />
      <VmResource :vm />
    </div>
    <div class="column">
      <VmVirtualisationAndBoot :vm />
      <VmManagement :vm />
      <VmGraphics :vm />
    </div>
  </div>
</template>

<script setup lang="ts">
import VmGeneralInfo from '@/components/vm/VmGeneralInfo.vue'
import VmGraphics from '@/components/vm/VmGraphics.vue'
import VmManagement from '@/components/vm/VmManagement.vue'
import VmResource from '@/components/vm/VmResource.vue'
import VmStorageConfig from '@/components/vm/VmStorageConfig.vue'
import VmSystemNetworking from '@/components/vm/VmSystemNetworking.vue'
import VmVirtualisationAndBoot from '@/components/vm/VmVirtualisationAndBoot.vue'
import type { XoVm } from '@/types/xo/vm.type'

defineProps<{ vm: XoVm }>()
</script>

<style scoped lang="postcss">
.system {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  width: 100%;

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  @media not (--mobile) {
    flex-direction: row;

    .column {
      width: 50%;
    }
  }

  @media (--mobile) {
    flex-direction: column;

    .column {
      width: 100%;
    }
  }
}
</style>
