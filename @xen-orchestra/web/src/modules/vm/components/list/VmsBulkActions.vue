<template>
  <VtsTableBulkActions :actions="bulkActions" />
</template>

<script lang="ts" setup>
import { useVmBulkPowerStateActions } from '@/modules/vm/composables/use-vm-bulk-power-state-actions.composable.ts'
import { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import { useXoVmSnapshotJob } from '@/modules/vm/jobs/xo-vm-snapshot.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms } = defineProps<{
  vms: FrontXoVm[]
}>()

const { t } = useI18n()

const { powerStateActions } = useVmBulkPowerStateActions(() => vms)

const {
  run: snapshotVms,
  canRun: canSnapshotVms,
  isRunning: isSnapshottingVms,
  errorMessage: snapshotVmsErrorMessage,
} = useXoVmSnapshotJob(() => vms)

const { deleteVms, canDeleteVms, isDeletingVms, deleteVmsErrorMessage } = useVmDelete(() => vms)

const isSelectionEmpty = computed(() => vms.length === 0)

const getHint = (errorMessage?: string) => (isSelectionEmpty.value ? t('no-vm-selected') : errorMessage)

const bulkActions = computed<ActionItem[]>(() => [
  {
    label: t('action:change-state'),
    icon: 'action:change-state',
    disabled: isSelectionEmpty.value,
    hint: getHint(),
    children: powerStateActions.value,
  },
  {
    label: t('snapshot'),
    icon: 'action:snapshot',
    onClick: () => snapshotVms(),
    disabled: !canSnapshotVms.value,
    busy: isSnapshottingVms.value,
    hint: getHint(snapshotVmsErrorMessage.value),
  },
  {
    label: t('action:delete'),
    icon: 'action:delete',
    onClick: () => deleteVms(),
    disabled: !canDeleteVms.value,
    busy: isDeletingVms.value,
    hint: getHint(deleteVmsErrorMessage.value),
    accent: 'danger',
  },
])
</script>
