<template>
  <UiButton
    v-tooltip="!canConnectVbd && connectErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectVbd"
    left-icon="status:success-circle"
    :busy="isConnectingVbd"
    @click="openVbdConnectModal()"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVbdConnectModal } from '@/modules/vbd/composables/use-vbd-connect-modal.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.js'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.js'
import UiButton from '@xen-orchestra/web-core/components/ui/button/UiButton.vue'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd?: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  openModal: openVbdConnectModal,
  canRun: canConnectVbd,
  isRunning: isConnectingVbd,
  errorMessage: connectErrorMessage,
} = useVbdConnectModal(
  () => (vbd ? [vbd] : []),
  () => vm
)
</script>
