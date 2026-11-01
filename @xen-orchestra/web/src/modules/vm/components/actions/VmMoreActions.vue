<template>
  <VtsChangeStateMenuItem v-if="showChangeState">
    <VmPowerStateActions :vm />
  </VtsChangeStateMenuItem>
  <VmMigrateButton :vm />
  <VmSnapshotButton :vm />
  <VmDuplicateButton :vm />
  <VmExportButton :vm />
  <VdfQuarantineMenuItem v-if="isVdfEnabled && hasVdfAgent(vm.$pool)" :vm />
  <MenuSeparator />
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import { useVdfAvailability } from '@/modules/vdf/composables/vdf-availability.composable.ts'
import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import VmDuplicateButton from '@/modules/vm/components/actions/duplicate/VmDuplicateButton.vue'
import VmExportButton from '@/modules/vm/components/actions/export/VmExportButton.vue'
import VmMigrateButton from '@/modules/vm/components/actions/migrate/VmMigrateButton.vue'
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'
import { defineAsyncComponent } from 'vue'

defineProps<{
  vm: FrontXoVm
  showChangeState?: boolean
}>()

const VdfQuarantineMenuItem = defineAsyncComponent(
  () => import('@/modules/vdf/components/vm/VdfQuarantineMenuItem.vue')
)

// tech preview: quarantine only while the vdf plugin is loaded, in pools
// with agents (a quarantine nothing enforces is worse than none)
const { isVdfEnabled, hasVdfAgent } = useVdfAvailability()
</script>
