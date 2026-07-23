<template>
  <MenuItem v-if="showChangeState" icon="action:change-state" class="change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <VmPowerStateActions :vm />
    </template>
  </MenuItem>
  <VmSnapshotButton :vm />
  <VmDuplicateButton :vm />
  <VmExportButton :vm />
  <MenuSeparator />
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import VmDuplicateButton from '@/modules/vm/components/actions/duplicate/VmDuplicateButton.vue'
import VmExportButton from '@/modules/vm/components/actions/export/VmExportButton.vue'
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm: FrontXoVm
  showChangeState?: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.change-state {
  color: var(--color-brand-txt-base);
}
</style>
