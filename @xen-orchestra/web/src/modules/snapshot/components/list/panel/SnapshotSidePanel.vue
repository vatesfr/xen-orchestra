<template>
  <VtsSidePanel :has-selection="!!snapshot" @close="emit('close')">
    <template v-if="snapshot" #actions>
      <UiButton
        :disabled="!canRevertVmSnapshot || isDeletingVmSnapshots"
        :busy="isRevertingVmSnapshot"
        size="medium"
        variant="tertiary"
        accent="brand"
        left-icon="action:undo"
        @click="revertVmSnapshot()"
      >
        {{ t('action:revert-vm-here') }}
      </UiButton>
      <VtsDeleteButton
        :disabled="!canDeleteVmSnapshots || isRevertingVmSnapshot"
        :busy="isDeletingVmSnapshots"
        @click="deleteVmSnapshots()"
      />
    </template>
    <template v-if="snapshot" #default>
      <SnapshotInfoCard :snapshot />
      <SnapshotVdiCard :snapshot />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import SnapshotInfoCard from '@/modules/snapshot/components/list/panel/cards/SnapshotInfoCard.vue'
import SnapshotVdiCard from '@/modules/snapshot/components/list/panel/cards/SnapshotVdiCard.vue'
import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useVmSnapshotDelete } from '@/modules/snapshot/composables/use-vm-snapshot-delete.composable.ts'
import { useVmSnapshotRevert } from '@/modules/snapshot/composables/use-vm-snapshot-revert.composable.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { snapshot } = defineProps<{ snapshot?: FrontXoVmSnapshot }>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { deleteVmSnapshots, canDeleteVmSnapshots, isDeletingVmSnapshots } = useVmSnapshotDelete(() =>
  snapshot !== undefined ? [snapshot] : []
)

const { revertVmSnapshot, canRevertVmSnapshot, isRevertingVmSnapshot } = useVmSnapshotRevert(() => snapshot)
</script>
