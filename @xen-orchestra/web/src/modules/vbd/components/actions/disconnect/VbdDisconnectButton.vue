<template>
  <UiButton
    v-tooltip="!canDisconnectVbds && disconnectVbdsErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisconnectVbds"
    left-icon="action:disconnect"
    :busy="isDisconnectingVbds"
    @click="disconnectVbds()"
  >
    {{ t('action:disconnect') }}
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

const { disconnectVbds, canDisconnectVbds, isDisconnectingVbds, disconnectVbdsErrorMessage } = useVbdConnection({
  vbds: () => [vbd],
  vm: () => vm,
})
</script>
