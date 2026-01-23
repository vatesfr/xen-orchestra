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
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{ vm: FrontXoVm }>()
</script>
