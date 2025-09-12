<template>
  <div :class="{ 'no-ui': !uiStore.hasUi }" class="vm-console-view">
    <div v-if="hasError">{{ t('error-occurred') }}</div>
    <UiSpinner v-else-if="!isReady" class="spinner" />
    <VtsStateHero v-else-if="!isVmRunning" format="page" type="offline" size="large">
      <span>{{ t('console-offline') }}</span>
      <span class="title typo-h1">{{ t('vm-not-running') }}</span>
      <div class="description typo-body-bold">
        <span>{{ t('console-unavailable-reason', { type: 'virtual machine' }) }}</span>
        <span>{{ t('start-console', { type: 'VM' }) }}</span>
      </div>
    </VtsStateHero>
    <template v-else-if="vm && vmConsole">
      <VtsLayoutConsole>
        <VtsRemoteConsole v-if="url" ref="console-element" :url :is-console-available="isConsoleAvailable" />
        <template #actions>
          <VtsActionsConsole :send-ctrl-alt-del="sendCtrlAltDel" />
          <VtsDivider type="stretch" />
          <VtsClipboardConsole />
        </template>
      </VtsLayoutConsole>
    </template>
  </div>
</template>

<script lang="ts" setup>
import UiSpinner from '@/components/ui/UiSpinner.vue'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useConsoleStore } from '@/stores/xen-api/console.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useUiStore } from '@core/stores/ui.store'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const STOP_OPERATIONS = [
  VM_OPERATION.SHUTDOWN,
  VM_OPERATION.CLEAN_SHUTDOWN,
  VM_OPERATION.HARD_SHUTDOWN,
  VM_OPERATION.CLEAN_REBOOT,
  VM_OPERATION.HARD_REBOOT,
  VM_OPERATION.PAUSE,
  VM_OPERATION.SUSPEND,
]

usePageTitleStore().setTitle(useI18n().t('console'))

const { t } = useI18n()

const route = useRoute<'/vm/[uuid]/console'>()
const uiStore = useUiStore()
const xenApiStore = useXenApiStore()

const { isReady: isVmReady, getByUuid: getVmByUuid, hasError: hasVmError } = useVmStore().subscribe()

const {
  isReady: isConsoleReady,
  getByOpaqueRef: getConsoleByOpaqueRef,
  hasError: hasConsoleError,
} = useConsoleStore().subscribe()

const isReady = computed(() => isVmReady.value && isConsoleReady.value)

const hasError = computed(() => hasVmError.value || hasConsoleError.value)

const vm = computed(() => getVmByUuid(route.params.uuid as XenApiVm['uuid']))

const isVmRunning = computed(() => vm.value?.power_state === VM_POWER_STATE.RUNNING)

const vmConsole = computed(() => {
  const consoleOpaqueRef = vm.value?.consoles[0]

  if (consoleOpaqueRef === undefined) {
    return
  }

  return getConsoleByOpaqueRef(consoleOpaqueRef)
})

const url = computed(() => {
  if (xenApiStore.currentSessionId == null) {
    return
  }
  const _url = new URL(vmConsole.value!.location)
  _url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  _url.searchParams.set('session_id', xenApiStore.currentSessionId)
  return _url
})

const isConsoleAvailable = computed(() =>
  vm.value !== undefined ? !isVmOperationPending(vm.value, STOP_OPERATIONS) : false
)

const consoleElement = useTemplateRef('console-element')

const sendCtrlAltDel = () => consoleElement.value?.sendCtrlAltDel()
</script>

<style lang="postcss" scoped>
.vm-console-view {
  display: flex;
  height: calc(100% - 14.5rem);
  flex-direction: column;

  &.no-ui {
    height: 100%;
  }

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
}

.spinner {
  color: var(--color-brand-txt-base);
  display: flex;
  margin: auto;
  width: 10rem;
  height: 10rem;
}
</style>
