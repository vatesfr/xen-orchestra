<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isSmall }">
    <template #header>
      <VtsDeleteButton
        :disabled="!canDeleteSnapshot"
        :busy="isDeletingSnapshot"
        class="delete-button"
        @click="openSnapshotDeleteModal()"
      />
      <div :class="{ 'action-buttons-container': uiStore.isSmall }">
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isSmall ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
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
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{ snapshot: FrontXoVmSnapshot }>()
const emit = defineEmits<{
  close: []
}>()

const uiStore = useUiStore()

const { t } = useI18n()

const {
  openModal: openSnapshotDeleteModal,
  canRun: canDeleteSnapshot,
  isRunning: isDeletingSnapshot,
} = useVmSnapshotDeleteModal(() => [snapshot])
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
