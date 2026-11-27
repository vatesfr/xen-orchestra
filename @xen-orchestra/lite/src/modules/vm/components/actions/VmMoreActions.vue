<template>
  <template v-if="layout === 'sections'">
    <VtsMenuTitle>{{ t('action:change-state') }}</VtsMenuTitle>
    <VmActionPowerStateItems :vm-refs :exclude />
    <VtsMenuTitle>{{ t('actions') }}</VtsMenuTitle>
  </template>
  <VtsChangeStateMenuItem v-else-if="layout === 'change-state-submenu'">
    <VmActionPowerStateItems :vm-refs />
  </VtsChangeStateMenuItem>
  <VmActionMigrateItem v-if="!exclude.migrate" :selected-refs="vmRefs" is-single-action />
  <VmActionSnapshotItem v-if="!exclude.snapshot" :vm-refs />
  <VmActionCopyItem :selected-refs="vmRefs" is-single-action />
  <VmActionExportItem :vm-refs is-single-action />
  <MenuSeparator v-if="layout !== 'sections'" />
  <VmActionDeleteItem :vm-refs />
</template>

<script lang="ts" setup>
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionDeleteItem from '@/components/vm/VmActionItems/VmActionDeleteItem.vue'
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import type { VmQuickAction } from '@/modules/vm/utils/vm.util.ts'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'
import VtsMenuTitle from '@core/components/menu/VtsMenuTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  vm,
  layout = 'actions-only',
  exclude = {},
} = defineProps<{
  vm: XenApiVm
  layout?: 'actions-only' | 'change-state-submenu' | 'sections'
  exclude?: Partial<Record<VmQuickAction, boolean>>
}>()

const { t } = useI18n()

const vmRefs = computed(() => [vm.$ref])
</script>
