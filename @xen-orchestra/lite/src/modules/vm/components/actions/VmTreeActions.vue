<template>
  <MenuItem accent="brand" class="change-state" icon="action:change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <VmActionPowerStateItems :vm-refs />
    </template>
  </MenuItem>
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
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmOpaqueRef } = defineProps<{
  vmOpaqueRef: XenApiVm['$ref']
}>()

const { t } = useI18n()

const vmRefs = computed(() => [vmOpaqueRef])
</script>

<style lang="postcss" scoped>
.change-state {
  color: var(--color-brand-txt-base);
}
</style>
