<template>
  <MenuItem icon="fa:trash" :disabled="!canRun" :busy="isRunning" @click="openDeleteModal">
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmDeleteJob } from '@/jobs/vm/vm-delete.job.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

const { run: deleteVM, canRun, isRunning } = useVmDeleteJob(() => [vm])

const openDeleteModal = useModal({
  component: import('@/components/modals/VmDeleteModal.vue'),
  props: { count: 1 },
  onConfirm: () => deleteVM(),
})
</script>
