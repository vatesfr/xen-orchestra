<template>
  <MenuItem icon="action:delete" :busy="isRunning" class="delete" @click="openModal()">
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmDeleteJob } from '@/modules/vm/jobs/xo-vm-delete.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: deleteVM, canRun, isRunning } = useXoVmDeleteJob(() => [vm])

const { xo5VmAdvancedHref } = useXoVmUtils(() => vm)

const openDeleteModal = useModal({
  component: import('@/modules/vm/components/modal/VmDeleteModal.vue'),
  props: { count: 1 },
  onConfirm: () => deleteVM(),
})

const openBlockedModal = useModal({
  component: import('@core/components/modal/VtsBlockedModal.vue'),
  props: { blockedOperation: 'destroy', href: xo5VmAdvancedHref },
})

const openModal = () => (canRun.value ? openDeleteModal() : openBlockedModal())
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
