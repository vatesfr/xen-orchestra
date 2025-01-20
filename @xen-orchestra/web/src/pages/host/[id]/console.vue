<template>
  <p v-if="!isHostConsoleRunning" class="typo h5-medium">{{ $t('power-on-host-for-console') }}</p>
  <VtsLayoutConsole v-else>
    <VtsRemoteConsole :url :is-console-available="isHostConsoleAvailable" />
    <template #actions>
      <VtsActionsConsole />
      <VtsDivider type="stretch" />
      <VtsClipboardConsole />
    </template>
  </VtsLayoutConsole>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { HOST_OPERATION, type XoHost } from '@/types/xo/host.type'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { computed } from 'vue'

const props = defineProps<{
  host: XoHost
}>()

const { isHostOperationPending } = useHostStore().subscribe()

const STOP_OPERATIONS = [HOST_OPERATION.SHUTDOWN, HOST_OPERATION.REBOOT]

const url = computed(
  () => new URL(`/api/consoles/${props.host.controlDomain}`, window.location.origin.replace(/^http/, 'ws'))
)

const isHostConsoleRunning = computed(() => props.host.power_state === 'Running')

const isHostConsoleAvailable = computed(() =>
  props.host.controlDomain !== undefined ? !isHostOperationPending(props.host!, STOP_OPERATIONS) : false
)
</script>
