<template>
  <MenuItem v-if="showChangeState" accent="brand" icon="action:change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <VmPowerStateActions :vm />
    </template>
  </MenuItem>
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
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm: FrontXoVm
  showChangeState?: boolean
}>()

const { t } = useI18n()

const VdfQuarantineMenuItem = defineAsyncComponent(
  () => import('@/modules/vdf/components/vm/VdfQuarantineMenuItem.vue')
)

// tech preview: quarantine only while the vdf plugin is loaded, in pools
// with agents (a quarantine nothing enforces is worse than none)
const { isVdfEnabled, hasVdfAgent } = useVdfAvailability()
</script>
