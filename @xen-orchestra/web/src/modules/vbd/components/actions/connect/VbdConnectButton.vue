<template>
  <VtsActionButton
    :hint="connectVbdsErrorMessage"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectVbds"
    icon="action:connect"
    :busy="isConnectingVbds"
    @click="connectVbds()"
  >
    {{ t('action:connect') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useVbdConnection } from '@/modules/vbd/composables/use-vbd-connection.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { connectVbds, canConnectVbds, isConnectingVbds, connectVbdsErrorMessage } = useVbdConnection({
  vbds: () => [vbd],
  vm: () => vm,
})
</script>
