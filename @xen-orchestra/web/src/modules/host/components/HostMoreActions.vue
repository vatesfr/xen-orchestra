<template>
  <MenuItem
    v-if="showChangeStateButton && !uiStore.isSmall"
    accent="brand"
    icon="action:change-state"
    class="change-state"
  >
    {{ t('action:change-state') }}
    <template #submenu>
      <HostPowerStateActions :host />
    </template>
  </MenuItem>
  <div v-if="uiStore.isSmall">
    <HostPowerStateActions :host />
    <VtsDivider type="stretch" />
  </div>
  <HostRestartToolstackButton :host />
  <template v-if="displayDisableButton">
    <HostDisableButton :host />
    <HostDisableAndEvacuateVmsButton :host />
  </template>
  <HostEnableButton v-else :host />
  <HostDetachButton :host />
  <HostForgetButton :host />
  <VtsDivider type="stretch" />
  <HostDownloadButton :host-id="host.id" />
</template>

<script lang="ts" setup>
import HostDetachButton from '@/modules/host/components/actions/detach/HostDetachButton.vue'
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDisableAndEvacuateVmsButton from '@/modules/host/components/actions/disable-and-evacuate-vms/HostDisableAndEvacuateVmsButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import HostForgetButton from '@/modules/host/components/actions/forget/HostForgetButton.vue'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import HostRestartToolstackButton from '@/modules/host/components/actions/restart-toolstack/HostRestartToolstackButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
  showChangeStateButton?: boolean
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const isHostHalted = computed(() => host.power_state === HOST_POWER_STATE.HALTED)

const displayDisableButton = computed(() => host.enabled || isHostHalted.value)
</script>

<style lang="postcss" scoped>
.change-state {
  color: var(--color-brand-txt-base);
}
</style>
