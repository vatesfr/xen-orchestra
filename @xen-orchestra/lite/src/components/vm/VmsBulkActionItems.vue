<template>
  <MenuItem accent="brand" icon="fa:power-off">
    {{ t('action:change-state') }}
    <template #submenu>
      <VmActionPowerStateItems :vm-refs="selectedRefs" />
    </template>
  </MenuItem>
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
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  selectedRefs: XenApiVm['$ref'][]
}>()

const { t } = useI18n()
</script>
