<template>
  <p v-if="!isVmConsoleAvailable" class="typo h5-medium">{{ $t('power-on-vm-for-console') }}</p>
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
import type { XoVm } from '@/types/xo/vm.type'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { computed } from 'vue'

const props = defineProps<{
  vm: XoVm
}>()

const url = computed(() => new URL(`/api/consoles/${props.vm.id}`, window.location.origin.replace(/^http/, 'ws')))

const isVmConsoleAvailable = computed(() => props.vm.power_state === 'Running' && props.vm.other.disable_pv_vnc !== '1')
</script>
