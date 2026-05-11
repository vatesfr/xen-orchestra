<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isSmall }" closable @close="emit('close')">
    <template #header>
      <UiButton
        :disabled="!canRevertSnapshot || isDeletingSnapshot"
        :busy="isRevertingSnapshot"
        size="medium"
        variant="tertiary"
        accent="brand"
        left-icon="action:undo"
        @click="openSnapshotRevertModal()"
      >
        {{ t('action:revert-vm-here') }}
      </UiButton>
      <VtsDeleteButton
        :disabled="!canDeleteSnapshot || isRevertingSnapshot"
        :busy="isDeletingSnapshot"
        class="delete-button"
        @click="openSnapshotDeleteModal()"
      />
    </template>
    <template #default>
      <SnapshotInfoCard :snapshot />
      <SnapshotVdiCard :snapshot />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import SnapshotInfoCard from '@/modules/snapshot/components/list/panel/cards/SnapshotInfoCard.vue'
import SnapshotVdiCard from '@/modules/snapshot/components/list/panel/cards/SnapshotVdiCard.vue'
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useVmSnapshotDeleteModal } from '@/modules/snapshot/composables/use-vm-snapshot-delete-modal.composable.ts'
import { useVmSnapshotRevertModal } from '@/modules/snapshot/composables/use-vm-snapshot-revert-modal.composable.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{
  snapshot: FrontXoVmSnapshot
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const {
  openModal: openSnapshotDeleteModal,
  canRun: canDeleteSnapshot,
  isRunning: isDeletingSnapshot,
} = useVmSnapshotDeleteModal(() => [snapshot])

const {
  openModal: openSnapshotRevertModal,
  canRun: canRevertSnapshot,
  isRunning: isRevertingSnapshot,
} = useVmSnapshotRevertModal(() => snapshot)
</script>

<style scoped lang="postcss">
.delete-button {
  margin-inline-end: auto;
}

.mobile-drawer {
  position: fixed;
  inset: 0;

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
