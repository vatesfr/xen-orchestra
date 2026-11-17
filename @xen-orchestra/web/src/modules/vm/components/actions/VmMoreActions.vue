<template>
  <template v-if="layout === 'sections'">
    <VtsMenuTitle>{{ t('action:change-state') }}</VtsMenuTitle>
    <VmPowerStateActions :vm :exclude />
    <VtsMenuTitle>{{ t('actions') }}</VtsMenuTitle>
  </template>
  <VtsChangeStateMenuItem v-else-if="layout === 'change-state-submenu'">
    <VmPowerStateActions :vm />
  </VtsChangeStateMenuItem>
  <VmMigrateButton v-if="!exclude.migrate" :vm />
  <VmSnapshotButton v-if="!exclude.snapshot" :vm />
  <VmDuplicateButton :vm />
  <VmExportButton :vm />
  <MenuSeparator v-if="layout !== 'sections'" />
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import VmDuplicateButton from '@/modules/vm/components/actions/duplicate/VmDuplicateButton.vue'
import VmExportButton from '@/modules/vm/components/actions/export/VmExportButton.vue'
import VmMigrateButton from '@/modules/vm/components/actions/migrate/VmMigrateButton.vue'
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VmQuickAction } from '@/modules/vm/utils/xo-vm.util.ts'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'
import VtsMenuTitle from '@core/components/menu/VtsMenuTitle.vue'
import { useI18n } from 'vue-i18n'

const { layout = 'actions-only', exclude = {} } = defineProps<{
  vm: FrontXoVm
  layout?: 'actions-only' | 'change-state-submenu' | 'sections'
  exclude?: Partial<Record<VmQuickAction, boolean>>
}>()

const { t } = useI18n()
</script>
