<template>
  <UiButton
    v-tooltip="!canReconfigureManagement && reconfigureManagementErrorMessage"
    size="medium"
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
  </UiButton>
</template>

<script lang="ts" setup>
import { usePifManagementReconfigureModal } from '@/modules/pif/composables/use-pif-management-reconfigure-modal.composable.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
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
