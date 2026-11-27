<template>
  <VtsChangeStateMenuItem>
    <VmActionPowerStateItems :vm-refs="selectedRefs" />
  </VtsChangeStateMenuItem>
  <VmActionMigrateItem :selected-refs />
  <VmActionCopyItem :selected-refs />
  <VmActionSnapshotItem :vm-refs="selectedRefs" />
  <VmActionExportItems :vm-refs="selectedRefs" />
  <VmActionDeleteItem :vm-refs="selectedRefs" />
</template>

<script lang="ts" setup>
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionDeleteItem from '@/components/vm/VmActionItems/VmActionDeleteItem.vue'
import VmActionExportItems from '@/components/vm/VmActionItems/VmActionExportItems.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'

defineProps<{
  selectedRefs: XenApiVm['$ref'][]
}>()
</script>
