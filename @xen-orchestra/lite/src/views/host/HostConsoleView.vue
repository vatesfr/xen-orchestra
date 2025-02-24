<template>
  <div :class="{ 'no-ui': !uiStore.hasUi }" class="host-console-view">
    <div v-if="hasError">{{ $t('error-occurred') }}</div>
    <UiSpinner v-else-if="!isReady" class="spinner" />
    <UiStatusPanel v-else-if="!isHostRunning" :image-source="monitor" :title="$t('power-on-host-for-console')" />
    <template v-else-if="host && hostConsole">
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
import monitor from '@/assets/monitor.svg'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiStatusPanel from '@/components/ui/UiStatusPanel.vue'
import { isHostOperationPending } from '@/libs/host'
import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useConsoleStore } from '@/stores/xen-api/console.store'
import { useControlDomainStore } from '@/stores/xen-api/control-domain.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import VtsActionsConsole from '@core/components/console/VtsActionsConsole.vue'
import VtsClipboardConsole from '@core/components/console/VtsClipboardConsole.vue'
import VtsLayoutConsole from '@core/components/console/VtsLayoutConsole.vue'
import VtsRemoteConsole from '@core/components/console/VtsRemoteConsole.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { useUiStore } from '@core/stores/ui.store'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const STOP_OPERATIONS = [HOST_OPERATION.SHUTDOWN]

usePageTitleStore().setTitle(useI18n().t('console'))

const route = useRoute()
const uiStore = useUiStore()
const xenApiStore = useXenApiStore()

const {
  isReady: isHostReady,
  getByUuid: getHostByUuid,
  hasError: hasHostError,
  runningHosts,
} = useHostStore().subscribe()
const { records: controlDomains } = useControlDomainStore().subscribe()

const {
  isReady: isConsoleReady,
  getByOpaqueRefs: getConsolesByOpaqueRefs,
  hasError: hasConsoleError,
} = useConsoleStore().subscribe()

const hasError = computed(() => hasHostError.value || hasConsoleError.value)

const host = computed(() => getHostByUuid(route.params.uuid as XenApiHost['uuid']))

const controlDomain = computed(() => {
  const controlDomainOpaqueRef = host.value?.control_domain
  return controlDomainOpaqueRef
    ? controlDomains.value.find(controlDomain => controlDomain.$ref === controlDomainOpaqueRef)
    : undefined
})

const hostConsole = computed(() =>
  getConsolesByOpaqueRefs(controlDomain.value?.consoles ?? []).find(
    console => console.location !== undefined && console.protocol === 'rfb'
  )
)

const isReady = computed(() => isHostReady.value && isConsoleReady.value && controlDomain.value)

const isHostRunning = computed(() => {
  return runningHosts.value.some(runningHost => runningHost.uuid === host.value?.uuid)
})

const url = computed(() => {
  if (xenApiStore.currentSessionId == null || hostConsole.value === undefined) {
    return
  }

  const _url = new URL(hostConsole.value!.location)
  _url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  _url.searchParams.set('session_id', xenApiStore.currentSessionId)

  return _url
})

const isConsoleAvailable = computed(() =>
  controlDomain.value !== undefined ? !isHostOperationPending(host.value!, STOP_OPERATIONS) : false
)

const consoleElement = useTemplateRef('console-element')

const sendCtrlAltDel = () => consoleElement.value?.sendCtrlAltDel()
</script>

<style lang="postcss" scoped>
.host-console-view {
  display: flex;
  height: calc(100% - 14.5rem);
  flex-direction: column;

  &.no-ui {
    height: 100%;
  }
}

.spinner {
  color: var(--color-brand-txt-base);
  display: flex;
  margin: auto;
  width: 10rem;
  height: 10rem;
}

.not-available {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  gap: 4rem;
  color: var(--color-brand-txt-base);
  font-size: 3.6rem;
}

.open-in-new-window {
  position: absolute;
  top: 0;
  right: 0;
  overflow: hidden;

  & > .link {
    display: flex;
    align-items: center;
    gap: 1rem;
    background-color: var(--color-brand-txt-base);
    color: var(--color-brand-txt-item);
    text-decoration: none;
    padding: 1.5rem;
    font-size: 1.6rem;
    border-radius: 0 0 0 0.8rem;
    white-space: nowrap;
    transform: translateX(calc(100% - 4.5rem));
    transition: transform 0.2s ease-in-out;

    &:hover {
      transform: translateX(0);
    }
  }
}

.host-console-view:deep(.menu-list) {
  background-color: transparent;
  align-self: center;
}
</style>
