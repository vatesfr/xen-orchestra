<template>
  <div :class="{ 'no-ui': !uiStore.hasUi }" class="host-console-view">
    <div v-if="hasError">{{ $t('error-occurred') }}</div>
    <UiSpinner v-else-if="!isReady" class="spinner" />
    <UiStatusPanel v-else-if="!isHostRunning" :image-source="monitor" :title="$t('power-on-host-for-console')" />
    <template v-else-if="host && hostConsole">
      <MenuList horizontal>
        <MenuItem v-if="uiStore.hasUi" :icon="faArrowUpRightFromSquare" @click="openInNewTab">
          {{ $t('open-console-in-new-tab') }}
        </MenuItem>
        <MenuItem
          :icon="uiStore.hasUi ? faUpRightAndDownLeftFromCenter : faDownLeftAndUpRightToCenter"
          @click="toggleFullScreen"
        >
          {{ $t(uiStore.hasUi ? 'fullscreen' : 'fullscreen-leave') }}
        </MenuItem>
        <MenuItem :disabled="!consoleElement" :icon="faKeyboard" @click="sendCtrlAltDel">
          {{ $t('send-ctrl-alt-del') }}
        </MenuItem>
      </MenuList>
      <RemoteConsole
        ref="consoleElement"
        :is-console-available="isConsoleAvailable"
        :location="hostConsole.location"
        class="remote-console"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import monitor from '@/assets/monitor.svg'
import RemoteConsole from '@/components/RemoteConsole.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiStatusPanel from '@/components/ui/UiStatusPanel.vue'
import { isVmOperationPending } from '@/libs/vm'
import { VM_OPERATION } from '@/libs/xen-api/xen-api.enums'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useConsoleStore } from '@/stores/xen-api/console.store'
import { useControlDomainStore } from '@/stores/xen-api/control-domain.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import { useUiStore } from '@core/stores/ui.store'
import {
  faArrowUpRightFromSquare,
  faDownLeftAndUpRightToCenter,
  faKeyboard,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

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

const router = useRouter()
const route = useRoute()
const uiStore = useUiStore()

const {
  isReady: isHostReady,
  getByUuid: getHostByUuid,
  hasError: hasHostError,
  runningHosts: getRunningHosts,
} = useHostStore().subscribe()
const { records: getRecords } = useControlDomainStore().subscribe()

const {
  isReady: isConsoleReady,
  getByOpaqueRef: getConsoleByOpaqueRef,
  hasError: hasConsoleError,
} = useConsoleStore().subscribe()

const hasError = computed(() => hasHostError.value || hasConsoleError.value)

const host = computed(() => getHostByUuid(route.params.uuid as XenApiHost['uuid']))

const vm = computed(() => {
  const controlDomainOpaqueRef = host.value?.control_domain
  return controlDomainOpaqueRef ? getRecords.value.find(vm => vm.$ref === controlDomainOpaqueRef) : undefined
})

const hostConsole = computed(() => {
  const consoleOpaqueRef = vm.value?.consoles[0]
  return consoleOpaqueRef ? getConsoleByOpaqueRef(consoleOpaqueRef) : undefined
})

const isReady = computed(() => isHostReady.value && isConsoleReady.value && vm.value)

const isHostRunning = computed(() => {
  return getRunningHosts.value.some(runningHost => runningHost.uuid === host.value?.uuid)
})

const isConsoleAvailable = computed(() =>
  vm.value !== undefined ? !isVmOperationPending(vm.value, STOP_OPERATIONS) : false
)

const consoleElement = ref()

const sendCtrlAltDel = () => consoleElement.value?.sendCtrlAltDel()

const toggleFullScreen = () => {
  uiStore.hasUi = !uiStore.hasUi
}

const openInNewTab = () => {
  const routeData = router.resolve({ query: { ui: '0' } })
  window.open(routeData.href, '_blank')
}
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
  color: var(--color-info-txt-base);
  display: flex;
  margin: auto;
  width: 10rem;
  height: 10rem;
}

.remote-console {
  flex: 1;
  max-width: 100%;
  height: 100%;
}

.not-available {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  gap: 4rem;
  color: var(--color-info-txt-base);
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
    background-color: var(--color-info-txt-base);
    color: var(--color-info-txt-item);
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
