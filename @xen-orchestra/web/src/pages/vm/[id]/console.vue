<template>
  <p v-if="!isVmConsoleRunning" class="typo-h5">{{ $t('power-on-vm-for-console') }}</p>
  <VtsLayoutConsole v-else>
    <VtsRemoteConsole ref="console-element" :url :is-console-available="isConsoleAvailable" />
    <template #actions>
      <VtsActionsConsole :send-ctrl-alt-del="sendCtrlAltDel" />
      <VtsDivider type="stretch" />
      <VtsClipboardConsole />
    </template>
  </VtsLayoutConsole>
</template>

<script lang="ts" setup>
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoVm } from '@/types/xo/vm.type'
import { VM_OPERATION } from '@/types/xo/vm.type'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { computed, useTemplateRef } from 'vue'

const props = defineProps<{
  vm: XoVm
}>()

const { isVmOperatingPending } = useVmStore().subscribe()

const STOP_OPERATIONS = [
  VM_OPERATION.SHUTDOWN,
  VM_OPERATION.CLEAN_SHUTDOWN,
  VM_OPERATION.HARD_SHUTDOWN,
  VM_OPERATION.CLEAN_REBOOT,
  VM_OPERATION.HARD_REBOOT,
  VM_OPERATION.PAUSE,
  VM_OPERATION.SUSPEND,
]

const url = computed(() => new URL(`/api/consoles/${props.vm.id}`, window.location.origin.replace(/^http/, 'ws')))

const isVmConsoleRunning = computed(() => props.vm.power_state === 'Running' && props.vm.other.disable_pv_vnc !== '1')

const isConsoleAvailable = computed(() =>
  props.vm !== undefined ? !isVmOperatingPending(props.vm, STOP_OPERATIONS) : false
)
const consoleElement = useTemplateRef('console-element')

const sendCtrlAltDel = () => consoleElement.value?.sendCtrlAltDel()
</script>
