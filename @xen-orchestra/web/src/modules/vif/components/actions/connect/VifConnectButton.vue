<template>
  <UiButton
    v-tooltip="!canConnectVif && connectErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectVif"
    left-icon="status:success-circle"
    :busy="isConnectingVif"
    @click="openVifConnectModal()"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVifConnectModal } from '@/modules/vif/composables/use-vif-connect-modal.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.js'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.js'
import UiButton from '@xen-orchestra/web-core/components/ui/button/UiButton.vue'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { vif, vm } = defineProps<{
  vif?: FrontXoVif
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  openModal: openVifConnectModal,
  canRun: canConnectVif,
  isRunning: isConnectingVif,
  errorMessage: connectErrorMessage,
} = useVifConnectModal(
  () => (vif ? [vif] : []),
  () => vm
)
</script>
