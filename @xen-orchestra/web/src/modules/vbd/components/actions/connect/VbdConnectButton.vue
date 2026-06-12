<template>
  <UiButton
    v-tooltip="!canConnectVbd && connectErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectVbd"
    :left-icon="leftIconButton"
    :busy="isConnectingVbd"
    @click="openVbdConnectModal()"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVbdConnectionToggleModal } from '@/modules/vbd/composables/use-vbd-connection-toggle-modal.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import UiButton from '@xen-orchestra/web-core/components/ui/button/UiButton.vue'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  vbd,
  vm,
  isVdiPage = false,
} = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
  isVdiPage?: boolean
}>()

const { t } = useI18n()

const {
  openModal: openVbdConnectModal,
  canRun: canConnectVbd,
  isRunning: isConnectingVbd,
  errorMessage: connectErrorMessage,
} = useVbdConnectionToggleModal(
  CONNECTION_ACTION.CONNECT,
  () => [vbd],
  () => vm
)

const leftIconButton = computed(() => {
  if (!isVdiPage || (isVdiPage && canConnectVbd.value)) {
    return 'status:success-circle'
  } else {
    return 'action:connect'
  }
})
</script>
