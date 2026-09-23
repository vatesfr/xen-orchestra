<template>
  <MenuItem
    v-if="vbd.attached"
    icon="action:disconnect"
    :disabled="!canDisconnectVbds"
    :busy="isDisconnectingVbds"
    @click="disconnectVbds()"
  >
    {{ t('action:disconnect') }}
    <i v-if="disconnectVbdsErrorMessage" class="em-dash-prefix">{{ disconnectVbdsErrorMessage }}</i>
  </MenuItem>
  <MenuItem v-else icon="action:connect" :disabled="!canConnectVbds" :busy="isConnectingVbds" @click="connectVbds()">
    {{ t('action:connect') }}
    <i v-if="connectVbdsErrorMessage" class="em-dash-prefix">{{ connectVbdsErrorMessage }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVbdConnection } from '@/modules/vbd/composables/use-vbd-connection.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  connectVbds,
  disconnectVbds,
  canConnectVbds,
  canDisconnectVbds,
  isConnectingVbds,
  isDisconnectingVbds,
  connectVbdsErrorMessage,
  disconnectVbdsErrorMessage,
} = useVbdConnection({
  vbds: () => [vbd],
  vm: () => vm,
})
</script>
