<template>
  <MenuItem icon="action:delete" :busy="isDeletingVms" accent="danger" @click="openModal()">
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import { useXo5VmRoute } from '@/modules/vm/composables/xo-vm-route-xo5.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { deleteVms, canDeleteVms, isDeletingVms } = useVmDelete(() => [vm])

const { xo5VmAdvancedHref } = useXo5VmRoute(() => vm)

const { open: openBlockedModal } = useBlockedModal()

function openModal() {
  if (!canDeleteVms.value) {
    return openBlockedModal({
      props: {
        blockedOperation: 'destroy',
        href: xo5VmAdvancedHref.value,
      },
    })
  }

  deleteVms()
}
</script>
