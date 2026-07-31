<template>
  <UiButton
    v-tooltip="!canConnectVbd && connectVbdErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectVbd"
    left-icon="action:connect"
    :busy="isConnectingVbd"
    @click="connectVbd()"
  >
    {{ t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useVbdConnection } from '@/modules/vbd/composables/use-vbd-connection.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { connectVbd, canConnectVbd, isConnectingVbd, connectVbdErrorMessage } = useVbdConnection({
  vbds: () => [vbd],
  vm: () => vm,
})
</script>
