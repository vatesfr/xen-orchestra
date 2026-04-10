<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isSmall }">
    <template #header>
      <div class="header-actions" :class="{ 'action-buttons-container': uiStore.isSmall }">
        <UiButton
          size="medium"
          variant="tertiary"
          accent="brand"
          :disabled="!canDeleteVbd"
          left-icon="action:disconnect"
          :busy="isDeletingVbd"
          @click="openDetachModal()"
        >
          {{ t('action:detach') }}
        </UiButton>
        <UiButton
          size="medium"
          variant="tertiary"
          accent="danger"
          :disabled="!canDeleteVdi"
          left-icon="fa:trash"
          :busy="isDeletingVdi"
          @click="openDeleteModal()"
        >
          {{ t('action:delete') }}
        </UiButton>
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
      <VdiInfosCard :vdi :vm />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useXoVbdDeleteJob } from '@/modules/vbd/jobs/xo-vbd-delete.job.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
import { useXoVdiDeleteJob } from '@/modules/vdi/jobs/xo-vdi-delete.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const { getVbdsByIds } = useXoVbdCollection()

const vbd = computed(() => getVbdsByIds(vdi.$VBDs).find(vbd => vbd.VDI === vdi.id))

const { run: deleteVdi, canRun: canDeleteVdi, isRunning: isDeletingVdi } = useXoVdiDeleteJob(() => [vdi])

const {
  run: deleteVbd,
  canRun: canDeleteVbd,
  isRunning: isDeletingVbd,
} = useXoVbdDeleteJob(() => (vbd.value ? [vbd.value] : []))

const openDetachModal = useModal({
  component: import('@/modules/vdi/components/modal/VdiDetachModal.vue'),
  props: { count: 1 },
  onConfirm: async () => {
    try {
      await deleteVbd()
      emit('close')
    } catch (error) {
      console.error('Error when detaching VDI:', error)
    }
  },
})

const openDeleteModal = useModal({
  component: import('@/modules/vdi/components/modal/VdiDeleteModal.vue'),
  props: { count: 1 },
  onConfirm: async () => {
    try {
      await deleteVdi()
    } catch (error) {
      console.error('Error when deleting VDI:', error)
    }
  },
})
</script>

<style scoped lang="postcss">
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
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
