<template>
  <MenuItem icon="action:migrate" :busy="isRunning" @click="openModal()">
    {{ t('action:migrate') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmMigrateDrawer } from '@/modules/vm/composables/use-vm-migrate-drawer.composable.ts'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { openDrawer, isBlocked, isRunning } = useVmMigrateDrawer(() => [vm])

const { xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const openBlockedModal = useModal({
  component: import('@core/components/modal/VtsBlockedModal.vue'),
  props: { blockedOperation: 'pool_migrate', href: xo5VmAdvancedHref },
})

const openModal = () => (isBlocked.value ? openBlockedModal() : openDrawer())
</script>
