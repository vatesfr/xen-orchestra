<template>
  <VtsColumns :class="{ mobile: uiStore.isMobile }">
    <VtsColumn>
      <VmGeneralInfo :vm />
      <VmNetworking :vm />
      <VmStorageConfig :vm />
      <VmResource :vm />
    </VtsColumn>
    <VtsColumn>
      <VmVirtualizationAndBoot :vm />
      <VmManagement :vm />
      <VmGraphics :vm />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import VmGeneralInfo from '@/components/vm/system/VmGeneralInfo.vue'
import VmGraphics from '@/components/vm/system/VmGraphics.vue'
import VmManagement from '@/components/vm/system/VmManagement.vue'
import VmNetworking from '@/components/vm/system/VmNetworking.vue'
import VmResource from '@/components/vm/system/VmResource.vue'
import VmStorageConfig from '@/components/vm/system/VmStorageConfig.vue'
import VmVirtualizationAndBoot from '@/components/vm/system/VmVirtualizationAndBoot.vue'
import type { XoVm } from '@/types/xo/vm.type'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import { useUiStore } from '@core/stores/ui.store'

defineProps<{ vm: XoVm }>()
const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.system {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  width: 100%;
  flex-direction: row;

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 50%;
  }

  &.mobile {
    flex-direction: column;

    .column {
      width: 100%;
    }
  }
}
</style>
