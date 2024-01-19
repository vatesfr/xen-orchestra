<template>
  <AppMenu
    :disabled="selectedRefs.length === 0"
    :horizontal="!isMobile"
    :shadow="isMobile"
    class="vms-actions-bar"
    placement="bottom-end"
  >
    <template v-if="isMobile" #trigger="{ isOpen, open }">
      <UiButton :active="isOpen" :icon="faEllipsis" transparent @click="open" />
    </template>
    <MenuItem :icon="faPowerOff">
      {{ $t('change-state') }}
      <template #submenu>
        <VmActionPowerStateItems :vm-refs="selectedRefs" />
      </template>
    </MenuItem>
    <VmActionMigrateItem :selected-refs="selectedRefs" />
    <VmActionCopyItem :selected-refs="selectedRefs" />
    <MenuItem v-tooltip="$t('coming-soon')" :icon="faEdit">
      {{ $t('edit-config') }}
    </MenuItem>
    <VmActionSnapshotItem :vm-refs="selectedRefs" />
    <VmActionExportItems :vm-refs="selectedRefs" />
    <VmActionDeleteItem :vm-refs="selectedRefs" />
  </AppMenu>
</template>

<script lang="ts" setup>
import AppMenu from '@/components/menu/AppMenu.vue'
import MenuItem from '@/components/menu/MenuItem.vue'
import UiButton from '@/components/ui/UiButton.vue'
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionDeleteItem from '@/components/vm/VmActionItems/VmActionDeleteItem.vue'
import VmActionExportItems from '@/components/vm/VmActionItems/VmActionExportItems.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import { vTooltip } from '@/directives/tooltip.directive'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useUiStore } from '@/stores/ui.store'
import { faEdit, faEllipsis, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'

defineProps<{
  disabled?: boolean
  selectedRefs: XenApiVm['$ref'][]
}>()

const { isMobile } = storeToRefs(useUiStore())
</script>

<style lang="postcss" scoped>
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-grey-500);
  background-color: var(--background-color-primary);
}
</style>
