<template>
  <MenuItem icon="action:delete" :busy="isRunning" @click="openModal">
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmDeleteJob } from '@/modules/vm/jobs/xo-vm-delete.job.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import type { XoVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: deleteVM, canRun, isRunning } = useXoVmDeleteJob(() => [vm])

const { buildXo5Route } = useXoRoutes()

const xo5VmGeneralHref = computed(() => buildXo5Route(`/vms/${vm.id}/advanced`))

const openDeleteModal = useModal({
  component: import('@core/components/modal/VtsDeleteModal.vue'),
  props: { count: 1, type: 'vms' },
  onConfirm: () => deleteVM(),
})

const openBlockedModal = useModal({
  component: import('@core/components/modal/VtsBlockedModal.vue'),
  onConfirm: () => window.open(xo5VmGeneralHref.value),
})

const openModal = () => (canRun.value ? openDeleteModal() : openBlockedModal())
</script>
