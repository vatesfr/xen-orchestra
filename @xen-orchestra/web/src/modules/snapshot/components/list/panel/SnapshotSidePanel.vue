<template>
  <VtsSidePanel :selected="!!snapshot" :closable="!!snapshot" @close="emit('close')">
    <template v-if="snapshot" #actions>
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
        @click="openSnapshotDeleteModal()"
      />
    </template>
    <template #default>
      <VtsStateHero v-if="!snapshot" format="panel" type="no-selection" size="medium" />
      <template v-else>
        <SnapshotInfoCard :snapshot />
        <SnapshotVdiCard :snapshot />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import SnapshotInfoCard from '@/modules/snapshot/components/list/panel/cards/SnapshotInfoCard.vue'
import SnapshotVdiCard from '@/modules/snapshot/components/list/panel/cards/SnapshotVdiCard.vue'
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useVmSnapshotDeleteModal } from '@/modules/snapshot/composables/use-vm-snapshot-delete-modal.composable.ts'
import { useVmSnapshotRevertModal } from '@/modules/snapshot/composables/use-vm-snapshot-revert-modal.composable.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{ snapshot?: FrontXoVmSnapshot }>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const {
  openModal: openSnapshotDeleteModal,
  canRun: canDeleteSnapshot,
  isRunning: isDeletingSnapshot,
} = useVmSnapshotDeleteModal(() => (snapshot !== undefined ? [snapshot] : []))

const {
  openModal: openSnapshotRevertModal,
  canRun: canRevertSnapshot,
  isRunning: isRevertingSnapshot,
} = useVmSnapshotRevertModal(() => snapshot as FrontXoVmSnapshot)
</script>
