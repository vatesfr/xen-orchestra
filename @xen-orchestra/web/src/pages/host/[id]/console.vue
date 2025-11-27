<template>
  <VtsStateHero v-if="!isHostConsoleRunning" format="page" type="offline" size="large">
    <span>{{ t('console-offline') }}</span>
    <span class="title typo-h1">{{ t('host-not-running') }}</span>
    <div class="description typo-body-bold">
      <span>{{ t('console-unavailable-reason', { type: 'host' }) }}</span>
      <span>{{ t('start-console', { type: 'host' }) }}</span>
    </div>
  </VtsStateHero>
  <VtsLayoutConsole v-else>
    <VtsRemoteConsole ref="console-element" :url :is-console-available="isHostConsoleAvailable" />
    <template #actions>
      <VtsActionsConsole :send-ctrl-alt-del="sendCtrlAltDel" />
      <VtsDivider type="stretch" />
      <VtsClipboardConsole />
    </template>
  </VtsLayoutConsole>
</template>

<script lang="ts" setup>
import { isHostOperationPending } from '@/utils/xo-records/host.util.ts'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { HOST_ALLOWED_OPERATIONS, type XoHost } from '@vates/types'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const STOP_OPERATIONS = [HOST_ALLOWED_OPERATIONS.SHUTDOWN, HOST_ALLOWED_OPERATIONS.REBOOT]

const url = computed(
  () => new URL(`/api/consoles/${props.host.controlDomain}`, window.location.origin.replace(/^http/, 'ws'))
)

const isHostConsoleRunning = computed(() => props.host.power_state === 'Running')

const isHostConsoleAvailable = computed(() =>
  props.host.controlDomain !== undefined ? !isHostOperationPending(props.host!, STOP_OPERATIONS) : false
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
