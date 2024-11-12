<template>
  <p v-if="!isHostConsoleAvailable" class="typo h5-medium">{{ $t('power-on-host-for-console') }}</p>
  <VtsLayoutConsole v-else>
    <VtsRemoteConsole :url />
    <template #actions>
      <VtsActionsConsole />
      <VtsDivider type="stretch" />
      <VtsClipboardConsole />
    </template>
  </VtsLayoutConsole>
</template>

<script lang="ts" setup>
import type { XoHost } from '@/types/xo/host.type'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { computed } from 'vue'

const props = defineProps<{
  host: XoHost
}>()

const url = computed(
  () => new URL(`/api/consoles/${props.host.controlDomain}`, window.location.origin.replace(/^http/, 'ws'))
)

const isHostConsoleAvailable = computed(() => props.host.power_state === 'Running')
</script>
