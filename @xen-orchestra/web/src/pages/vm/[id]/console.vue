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
      <VtsClipboardConsole />
    </template>
  </VtsLayoutConsole>
</template>

<script lang="ts" setup>
import { isVmOperatingPending } from '@/modules/vm/utils/vm.util.ts'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { VM_OPERATIONS, type XoVm } from '@vates/types'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()

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
  props.vm !== undefined ? !isVmOperatingPending(props.vm, STOP_OPERATIONS) : false
)
const consoleElement = useTemplateRef('console-element')

const sendCtrlAltDel = () => consoleElement.value?.sendCtrlAltDel()
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
