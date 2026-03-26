<template>
  <VtsStateHero v-if="!isVmConsoleRunning" format="page" type="offline" size="large">
    <span>{{ t('console-offline') }}</span>
    <span class="title typo-h1">{{ t('vm-not-running') }}</span>
    <div class="description typo-body-bold">
      <span>{{ t('console-unavailable-reason', { type: 'virtual machine' }) }}</span>
      <span>{{ t('start-console', { type: 'VM' }) }}</span>
    </div>
  </VtsStateHero>
  <VtsLayoutConsole v-else>
    <VtsRemoteConsole ref="console-element" :url :is-console-available="isConsoleAvailable" />
    <template #actions>
      <VtsActionsConsole :send-ctrl-alt-del="sendCtrlAltDel" />
      <VtsDivider type="stretch" />
      <VtsClipboardConsole
        :clipboard-text="clipboardText"
        :has-guest-tools="guestToolsDetected"
        :guest-tools-url="XCP_LINKS.GUEST_TOOLS"
        @send="sendClipboard"
      />
    </template>
  </VtsLayoutConsole>
</template>

<script lang="ts" setup>
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmOperationPending } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { XCP_LINKS } from '@core/constants.ts'
import { VM_OPERATIONS } from '@vates/types'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()
const { hasGuestTools } = useXoVmUtils(() => vm)

const STOP_OPERATIONS = [
  VM_OPERATIONS.SHUTDOWN,
  VM_OPERATIONS.CLEAN_SHUTDOWN,
  VM_OPERATIONS.HARD_SHUTDOWN,
  VM_OPERATIONS.CLEAN_REBOOT,
  VM_OPERATIONS.HARD_REBOOT,
  VM_OPERATIONS.PAUSE,
  VM_OPERATIONS.SUSPEND,
]

const url = computed(() => new URL(`/api/consoles/${vm.id}`, window.location.origin.replace(/^http/, 'ws')))

const isVmConsoleRunning = computed(() => vm.power_state === 'Running' && vm.other.disable_pv_vnc !== '1')

const isConsoleAvailable = computed(() => !isVmOperationPending(vm, STOP_OPERATIONS))
const consoleElement = useTemplateRef<InstanceType<typeof VtsRemoteConsole>>('console-element')
const guestToolsDetected = computed(() => hasGuestTools(vm))

const sendCtrlAltDel = () => consoleElement.value?.sendCtrlAltDel()
const clipboardText = computed<string>(() => consoleElement.value?.clipboardText ?? '')
const sendClipboard = (text: string) =>
  hasGuestTools(vm) ? consoleElement.value?.sendClipboard(text) : consoleElement.value?.sendTextAsKeys(text)
</script>

<style scoped lang="postcss">
.title {
  color: var(--color-neutral-txt-primary);
}

.description {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  align-items: center;
  color: var(--color-neutral-txt-secondary);
}
</style>
