<template>
  <VtsChangeStateMenuItem>
    <VmActionPowerStateItems :vm-refs />
  </VtsChangeStateMenuItem>
  <VmActionSnapshotItem :vm-refs />
  <VmActionCopyItem :selected-refs="vmRefs" is-single-action />
  <VmActionExportItem :vm-refs is-single-action />
  <MenuSeparator />
  <VmActionDeleteItem :vm-refs />
</template>

<script setup lang="ts">
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionDeleteItem from '@/components/vm/VmActionItems/VmActionDeleteItem.vue'
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'
import { computed } from 'vue'

const { vmOpaqueRef } = defineProps<{
  vmOpaqueRef: XenApiVm['$ref']
}>()

const vmRefs = computed(() => [vmOpaqueRef])
</script>
