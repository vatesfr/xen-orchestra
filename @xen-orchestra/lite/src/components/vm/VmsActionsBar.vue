<template>
  <UiButtonIcon v-if="isMobile" :icon="faEllipsis" accent="info" size="medium" v-bind="menu.$trigger" />

  <VtsMenuList
    :border="isMobile"
    :horizontal="!isMobile"
    class="vms-actions-bar"
    v-bind="isMobile ? menu.$target : undefined"
  >
    <VtsMenuItem :icon="faPowerOff" v-bind="menu.powerState.$trigger">
      {{ $t('change-state') }}
    </VtsMenuItem>
    <Teleport to="body">
      <VtsMenuList v-bind="menu.powerState.$target" border>
        <VmActionPowerStateItems :vm-refs="selectedRefs" />
      </VtsMenuList>
    </Teleport>
    <VmActionMigrateItem :menu :selected-refs="selectedRefs" />
    <VmActionCopyItem :menu :selected-refs="selectedRefs" />
    <VtsMenuItem :icon="faEdit" v-bind="menu.editConfig">
      {{ $t('edit-config') }}
    </VtsMenuItem>
    <VmActionSnapshotItem :menu :vm-refs="selectedRefs" />
    <VmActionExportItems :menu :vm-refs="selectedRefs" />
    <VmActionDeleteItem :vm-refs="selectedRefs" />
  </VtsMenuList>
</template>

<script lang="ts" setup>
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionDeleteItem from '@/components/vm/VmActionItems/VmActionDeleteItem.vue'
import VmActionExportItems from '@/components/vm/VmActionItems/VmActionExportItems.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsMenuItem from '@core/components/menu/VtsMenuItem.vue'
import VtsMenuList from '@core/components/menu/VtsMenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { action, toggle, useMenuToggle } from '@core/packages/menu'
import { useUiStore } from '@core/stores/ui.store'
import { faEdit, faEllipsis, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { noop } from '@vueuse/shared'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

defineProps<{
  disabled?: boolean
  selectedRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()

const { isMobile } = storeToRefs(useUiStore())

const menu = useMenuToggle({
  placement: 'bottom-end',
  items: {
    powerState: toggle({}),
    editConfig: action(noop, { disabled: t('coming-soon') }),
  },
})
</script>

<style lang="postcss" scoped>
.vms-actions-bar {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
}
</style>
