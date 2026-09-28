<template>
  <VtsLayoutConsole v-if="isVmConsoleRunning || isBrowserMediaAvailable">
    <VtsRemoteConsole v-if="isVmConsoleRunning" ref="console-element" :url :is-console-available="isConsoleAvailable" />
    <VmConsoleOffline v-else />
    <template #actions>
      <!-- available while halted, so that an ISO can be connected before starting the VM -->
      <template v-if="isBrowserMediaAvailable">
        <BrowserMediaConsoleSection :vm />
        <VtsDivider v-if="isVmConsoleRunning" type="stretch" />
      </template>
      <template v-if="isVmConsoleRunning">
        <VtsActionsConsole :send-ctrl-alt-del="sendCtrlAltDel" />
        <VtsDivider type="stretch" />
        <VtsClipboardConsole />
      </template>
    </template>
  </VtsLayoutConsole>
  <VmConsoleOffline v-else />
</template>

<script lang="ts" setup>
import BrowserMediaConsoleSection from '@/modules/browser-media/components/BrowserMediaConsoleSection.vue'
import { useXoBrowserMediaCollection } from '@/modules/browser-media/remote-resources/use-xo-browser-media-collection.ts'
import VmConsoleOffline from '@/modules/vm/components/console/VmConsoleOffline.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmOperationPending } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { VM_OPERATIONS } from '@vates/types'
import { computed, useTemplateRef } from 'vue'

const props = defineProps<{
  vm: FrontXoVm
}>()

const { isBrowserMediaAvailable } = useXoBrowserMediaCollection()

const STOP_OPERATIONS = [
  VM_OPERATIONS.SHUTDOWN,
  VM_OPERATIONS.CLEAN_SHUTDOWN,
  VM_OPERATIONS.HARD_SHUTDOWN,
  VM_OPERATIONS.CLEAN_REBOOT,
  VM_OPERATIONS.HARD_REBOOT,
  VM_OPERATIONS.PAUSE,
  VM_OPERATIONS.SUSPEND,
]

const url = computed(() => new URL(`/api/consoles/${props.vm.id}`, window.location.origin.replace(/^http/, 'ws')))

const isVmConsoleRunning = computed(() => props.vm.power_state === 'Running' && props.vm.other.disable_pv_vnc !== '1')

const isConsoleAvailable = computed(() =>
  props.vm !== undefined ? !isVmOperationPending(props.vm, STOP_OPERATIONS) : false
)
const consoleElement = useTemplateRef('console-element')

const sendCtrlAltDel = () => consoleElement.value?.sendCtrlAltDel()
</script>
