<template>
  <VtsColumns>
    <VtsColumn>
      <VmSystemGeneralInfo :vm />
      <VmSystemNetworking :vm />
      <VmSystemStorageConfig :vm />
      <VmSystemResource :vm />
    </VtsColumn>
    <VtsColumn>
      <VmSystemVirtualizationAndBoot :vm />
      <VmSystemManagement :vm />
      <VmSystemGraphics :vm />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import VmSystemGeneralInfo from '@/modules/vm/components/system/VmSystemGeneralInfo.vue'
import VmSystemGraphics from '@/modules/vm/components/system/VmSystemGraphics.vue'
import VmSystemManagement from '@/modules/vm/components/system/VmSystemManagement.vue'
import VmSystemNetworking from '@/modules/vm/components/system/VmSystemNetworking.vue'
import VmSystemResource from '@/modules/vm/components/system/VmSystemResource.vue'
import VmSystemStorageConfig from '@/modules/vm/components/system/VmSystemStorageConfig.vue'
import VmSystemVirtualizationAndBoot from '@/modules/vm/components/system/VmSystemVirtualizationAndBoot.vue'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import type { XoVm } from '@vates/types'

defineProps<{ vm: XoVm }>()
</script>
