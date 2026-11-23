<template>
  <VtsActionButton
    :hint="reconfigureManagementErrorMessage"
    variant="tertiary"
    accent="brand"
    :disabled="!canReconfigureManagement"
    :busy="isReconfiguringManagement"
    @click="openManagementReconfigureModal()"
  >
    <VtsIcon
      v-if="!isReconfiguringManagement"
      :name="canReconfigureManagement ? 'status:primary-circle' : 'status:primary-circle-disabled'"
      size="medium"
    />
    {{ t('action:set-pif-management') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { usePifManagementReconfigureModal } from '@/modules/pif/composables/use-pif-management-reconfigure-modal.composable.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: FrontXoPif
}>()

const { t } = useI18n()

const {
  openModal: openManagementReconfigureModal,
  canRun: canReconfigureManagement,
  isRunning: isReconfiguringManagement,
  errorMessage: reconfigureManagementErrorMessage,
} = usePifManagementReconfigureModal(() => pif)
</script>
