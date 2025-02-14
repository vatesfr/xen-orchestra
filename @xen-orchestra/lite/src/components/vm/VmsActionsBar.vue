<template>
  <MenuList
    :disabled="selectedRefs.length === 0"
    :horizontal="!isMobile"
    :no-border="!isMobile"
    class="vms-actions-bar"
    placement="bottom-end"
  >
    <template v-if="isMobile" #trigger="{ isOpen, open }">
      <UiButtonIcon accent="brand" size="medium" :selected="isOpen" :icon="faEllipsis" @click="open" />
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
  </MenuList>
</template>

<script lang="ts" setup>
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionDeleteItem from '@/components/vm/VmActionItems/VmActionDeleteItem.vue'
import VmActionExportItems from '@/components/vm/VmActionItems/VmActionExportItems.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store'
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
  border-bottom: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
}
</style>
